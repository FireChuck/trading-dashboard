// compare.js — Comparison Split-View Module
// Route: #/compare
// Renders a 50/50 split layout with independent bot & viz selectors per side.

const CompareModule = (() => {
  // Viz names that match the SPA's routeable viz modules
  const VIZ_NAMES = [
    { id: 'kpi-overview', label: 'KPI Overview' },
    { id: 'equity-curve', label: 'Equity Curve' },
    { id: 'pnl-by-pair', label: 'P&L by Pair' },
    { id: 'avg-trade-pnl', label: 'Avg Trade P&L' },
    { id: 'max-drawdown', label: 'Max Drawdown' },
    { id: 'win-rate', label: 'Win Rate' },
    { id: 'profit-factor', label: 'Profit Factor' },
    { id: 'sharpe', label: 'Sharpe Ratio' },
    { id: 'trade-heatmap', label: 'Trade Heatmap' },
  ];

  // Fallback map: canonical ID → legacy filename (for pre-Worker-2 transition)
  const VIZ_FILE_MAP = {
    'kpi-overview': 'viz-kpi-overview',
    'equity-curve': 'viz-equity-curve',
    'pnl-by-pair': 'viz-pnl-by-pair',
    'avg-trade-pnl': 'viz-avg-trade-pnl',
    'max-drawdown': 'viz-max-drawdown',
    'win-rate': 'viz-win-rate',
    'profit-factor': 'viz-profit-factor',
    'sharpe': 'viz-sharpe',
    'trade-heatmap': 'viz-trade-heatmap',
  };

  // Track state per panel
  let _panels = [null, null]; // { botId, vizId, destroy }
  let _container = null;
  let _allBotData = null;
  let _options = {};
  let _initialized = false;

  /**
   * render — Called by the SPA router.
   * @param {HTMLElement} container  — the #app div or parent
   * @param {object} allBotData     — { bots: { "Bot1": {...}, ... } }
   * @param {object} [options]      — optional config
   * @returns {Function} destroy function
   */
  async function render(container, allBotData, options = {}) {
    _container = container;
    _allBotData = allBotData;
    _options = options || {};

    // Build DOM
    container.innerHTML = buildHTML(getBotIds(allBotData));

    // Get panel elements
    const panelEls = container.querySelectorAll('.compare-panel');
    const panel0 = panelEls[0];
    const panel1 = panelEls[1];

    // Initialize panels with defaults
    const botIds = getBotIds(allBotData);
    _panels[0] = { botId: botIds[0], vizId: VIZ_NAMES[0].id, destroy: null };
    _panels[1] = { botId: botIds.length > 1 ? botIds[1] : botIds[0], vizId: VIZ_NAMES[0].id, destroy: null };

    // Wire up selectors
    wirePanel(panel0, 0);
    wirePanel(panel1, 1);

    // Initial renders
    await renderPanel(0);
    await renderPanel(1);

    _initialized = true;

    // Return destroy
    return destroy;
  }

  function getBotIds(allBotData) {
    if (!allBotData) return [];
    // Support both { bots: { ... } } and direct bot object
    if (allBotData.bots) return Object.keys(allBotData.bots);
    return Object.keys(allBotData);
  }

  function buildHTML(botIds) {
    const botOptions = botIds.map(id => `<option value="${id}">${id}</option>`).join('');
    const vizOptions = VIZ_NAMES.map(v => `<option value="${v.id}">${v.label}</option>`).join('');

    return `
      <div class="compare-container">
        <div class="compare-header">
          <h2 class="compare-title">📊 Compare</h2>
          <p class="compare-subtitle">Select a bot and visualization for each panel</p>
        </div>
        <div class="compare-layout">
          ${buildPanelHTML(0, botOptions, vizOptions)}
          ${buildPanelHTML(1, botOptions, vizOptions)}
        </div>
      </div>
    `;
  }

  function buildPanelHTML(index, botOptions, vizOptions) {
    return `
      <div class="compare-panel" data-panel="${index}">
        <div class="compare-panel-header">
          <label class="compare-label">Bot</label>
          <select class="compare-select compare-bot-select" data-panel="${index}">
            ${botOptions}
          </select>
          <label class="compare-label">Visualization</label>
          <select class="compare-select compare-viz-select" data-panel="${index}">
            ${vizOptions}
          </select>
        </div>
        <div class="compare-chart-area">
          <div class="compare-chart-container" data-panel="${index}"></div>
        </div>
      </div>
    `;
  }

  function wirePanel(panelEl, index) {
    const botSelect = panelEl.querySelector('.compare-bot-select');
    const vizSelect = panelEl.querySelector('.compare-viz-select');

    botSelect.addEventListener('change', () => {
      _panels[index].botId = botSelect.value;
      renderPanel(index);
    });

    vizSelect.addEventListener('change', () => {
      _panels[index].vizId = vizSelect.value;
      renderPanel(index);
    });
  }

  async function renderPanel(index) {
    // Destroy previous chart
    if (_panels[index].destroy) {
      try { _panels[index].destroy(); } catch (_) {}
      _panels[index].destroy = null;
    }

    const panel = _panels[index];
    const chartContainer = _container.querySelector(
      `.compare-chart-container[data-panel="${index}"]`
    );
    if (!chartContainer) return;

    // Clear previous content
    chartContainer.innerHTML = '<div class="compare-loading">Loading…</div>';

    try {
      // Ensure Chart.js is available (global from app.js lazy-load)
      if (typeof Chart === 'undefined') {
        // If not loaded yet, try dynamic import
        const mod = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js');
        // Chart.js UMD sets window.Chart
      }

      // Dynamic import the viz module
      const vizFileName = VIZ_FILE_MAP[panel.vizId];
      if (!vizFileName) throw new Error(`Unknown viz: ${panel.vizId}`);
      const vizModule = await import(`./${vizFileName}.js`);

      // Get bot data — use getMockData if available, else raw bot object
      let botData;
      if (_options.getMockData) {
        botData = _options.getMockData(panel.botId, 'daily');
      } else if (_allBotData.bots) {
        botData = _allBotData.bots[panel.botId];
      } else {
        botData = _allBotData[panel.botId];
      }

      if (!botData) {
        chartContainer.innerHTML = `<div class="compare-error">No data for bot "${panel.botId}"</div>`;
        return;
      }

      // Call the viz render — ES module API: export function render(container, botData, options)
      const renderFn = vizModule.render || (vizModule.default && vizModule.default.render);
      if (typeof renderFn === 'function') {
        const destroy = renderFn(chartContainer, botData, { botId: panel.botId, timeframe: 'daily' });
        _panels[index].destroy = typeof destroy === 'function' ? destroy : null;
      } else {
        chartContainer.innerHTML = '<div class="compare-error">Viz module has no render function</div>';
      }
    } catch (err) {
      chartContainer.innerHTML = `<div class="compare-error">Error loading "${panel.vizId}": ${err.message}</div>`;
      console.error(`[Compare Panel ${index}]`, err);
    }
  }

  function destroy() {
    // Destroy both panels
    for (let i = 0; i < 2; i++) {
      if (_panels[i] && _panels[i].destroy) {
        try { _panels[i].destroy(); } catch (_) {}
        _panels[i].destroy = null;
      }
    }
    if (_container) {
      _container.innerHTML = '';
    }
    _panels = [null, null];
    _container = null;
    _allBotData = null;
    _initialized = false;
  }

  return { render, destroy, VIZ_NAMES };
})();

// Export for ES module consumers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompareModule;
}
// Also expose globally for script-tag usage
window.CompareModule = CompareModule;
export { CompareModule };
export default CompareModule;
