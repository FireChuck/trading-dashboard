// viz-session-analytics.js — A7: Performance by Session (Horizontal Bars)
window.VizSessionAnalytics = (() => {
  let _container = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function render(container, botId, timeframe) {
    if (_rendering) return;
    _rendering = true;
    try {
    const data = window.getMockData(botId, timeframe);
    if (!data || !container) return;

    cleanup();

    _container = container;
    _lastBotId = botId;
    _lastTimeframe = timeframe;

    const stats = data.sessionStats || [];
    if (!stats.length) {
      container.innerHTML = '<div style="color:var(--text-secondary);font-size:var(--text-sm);padding:16px;">No session data</div>';
      return;
    }

    const T = window.ThemeColors();

    const maxPnl = Math.max(...stats.map(s => Math.abs(s.pnl)), 1);

    let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    stats.forEach(s => {
      const pnlColor = s.pnl >= 0 ? T.profit : T.loss;
      const barWidth = Math.max(2, (Math.abs(s.pnl) / maxPnl) * 100);
      const pnlText = (s.pnl >= 0 ? '+$' : '-$') + Math.abs(s.pnl).toLocaleString();

      html += `<div class="session-bar-row" style="display:flex;align-items:center;gap:8px;padding:4px 0;">
        <div style="flex:0 0 70px;font-size:11px;font-weight:500;color:${T.text};font-family:var(--sans);">${s.session}</div>
        <div style="flex:1;height:24px;background:${T.canvasBg};border-radius:4px;overflow:hidden;position:relative;">
          <div style="height:100%;background:${pnlColor};opacity:0.75;width:${barWidth}%;border-radius:4px;"></div>
        </div>
        <div style="flex:0 0 auto;text-align:right;">
          <div style="font-size:12px;font-weight:600;color:${pnlColor};font-family:var(--mono);">${pnlText}</div>
          <div style="font-size:9px;color:${T.textMuted};font-family:var(--sans);">${s.tradeCount} trades · ${s.winRate.toFixed(1)}% WR</div>
        </div>
      </div>`;
    });
    html += '</div>';

    container.innerHTML = html;

    setupObservers(botId, timeframe);
    } finally { _rendering = false; }
  }

  function cleanup() {
    _rendering = false;
    if (_ro) { _ro.disconnect(); _ro = null; }
    if (_themeObs) { _themeObs.disconnect(); _themeObs = null; }
    if (_container) { _container.innerHTML = ''; }
    _container = null;
  }

  function setupObservers(botId, timeframe) {
    if (!_container) return;
    _ro = new ResizeObserver(() => render(_container, botId, timeframe));
    _ro.observe(_container);
    _themeObs = new MutationObserver(() => render(_container, botId, timeframe));
    _themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function update(botId, timeframe) {
    _lastBotId = botId;
    _lastTimeframe = timeframe;
    render(_container, botId, timeframe);
  }

  return { render, update, destroy: cleanup };
})();
