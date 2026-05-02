// viz-trade-heatmap.js — A3: GitHub-style Trade Heatmap (Day × Hour)
window.VizTradeHeatmap = (() => {
  let _container = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function getPnlColor(pnl) {
    const T = window.ThemeColors();
    if (pnl > 0) {
      const intensity = Math.min(pnl / 500, 1);
      const base = T.dark ? [74, 222, 128] : [22, 163, 74];
      const alpha = T.dark ? 0.2 + intensity * 0.7 : 0.15 + intensity * 0.7;
      return `rgba(${base.join(',')}, ${alpha})`;
    } else if (pnl < 0) {
      const intensity = Math.min(Math.abs(pnl) / 500, 1);
      const base = T.dark ? [248, 113, 113] : [220, 38, 38];
      const alpha = T.dark ? 0.2 + intensity * 0.7 : 0.15 + intensity * 0.7;
      return `rgba(${base.join(',')}, ${alpha})`;
    }
    return T.empty;
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

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

    const T = window.ThemeColors();
    const trades = data.trades || [];
    if (!trades.length) {
      container.innerHTML = '<div style="color:var(--text-secondary);font-size:var(--text-sm);padding:16px;">No trade data for this timeframe</div>';
      return;
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const matrix = {};

    trades.forEach((t, idx) => {
      const d = new Date(t.date);
      let dayIdx = d.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6;
      const hourIdx = simpleHash(t.date + t.pair + idx) % 24;
      const key = `${dayIdx}-${hourIdx}`;
      if (!matrix[key]) matrix[key] = { pnl: 0, count: 0 };
      matrix[key].pnl += t.pnl;
      matrix[key].count++;
    });

    const cellSize = 18;
    const gap = 3;
    const labelWidth = 32;
    const headerHeight = 20;
    const width = labelWidth + hours.length * (cellSize + gap);
    const height = headerHeight + days.length * (cellSize + gap);

    let svg = `<svg class="heatmap-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;

    hours.filter(h => h % 3 === 0).forEach(h => {
      svg += `<text x="${labelWidth + h * (cellSize + gap) + cellSize / 2}" y="12" text-anchor="middle" fill="${T.textTertiary}" font-size="9px" font-family="'SF Mono', monospace">${h}:00</text>`;
    });

    days.forEach((day, di) => {
      svg += `<text x="${labelWidth - 4}" y="${headerHeight + di * (cellSize + gap) + cellSize / 2 + 3}" text-anchor="end" fill="${T.textMuted}" font-size="10px" font-weight="500">${day}</text>`;

      hours.forEach(h => {
        const key = `${di}-${h}`;
        const data = matrix[key] || { pnl: 0, count: 0 };
        const x = labelWidth + h * (cellSize + gap);
        const y = headerHeight + di * (cellSize + gap);
        const fill = data.count > 0 ? getPnlColor(data.pnl) : T.canvasBg;

        svg += `<rect class="heatmap-cell" data-day="${day}" data-hour="${h}" data-pnl="${data.pnl.toFixed(0)}" data-count="${data.count}" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${fill}"/>`;
      });
    });

    svg += `</svg>`;

    container.innerHTML = `<div style="position:relative;">${svg}<div id="heatmapTooltip" class="heatmap-tooltip" style="display:none;position:fixed;padding:8px 12px;background:var(--tip-bg);border:1px solid var(--tip-border);border-radius:8px;font-size:11px;font-family:var(--sans);box-shadow:var(--shadow-md);pointer-events:none;z-index:100;"></div></div>`;

    const tooltip = container.querySelector('#heatmapTooltip');

    container.querySelectorAll('.heatmap-cell').forEach(el => {
      el.addEventListener('mouseenter', function() {
        const count = parseInt(this.dataset.count);
        if (count === 0) return;
        const pnl = parseFloat(this.dataset.pnl);
        const day = this.dataset.day;
        const hour = this.dataset.hour;
        const pnlClass = pnl >= 0 ? 'text-profit' : 'text-loss';
        tooltip.innerHTML = `<div class="tooltip-label">${day} ${hour}:00</div><div class="tooltip-value ${pnlClass}">$${pnl.toFixed(0)}</div><div class="tooltip-label">${count} trades</div>`;
        tooltip.classList.add('visible');
        tooltip.style.display = 'block';
      });
      el.addEventListener('mousemove', function(e) {
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top = (e.clientY - 8) + 'px';
      });
      el.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
        tooltip.style.display = 'none';
      });
    });

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
