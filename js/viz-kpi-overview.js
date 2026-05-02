// viz-kpi-overview.js — A1: Key Metrics Cards
window.VizKpiOverview = (() => {
  function formatPnl(v) {
    const prefix = v >= 0 ? '+' : '';
    return prefix + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatPercent(v) {
    return v.toFixed(1) + '%';
  }

  function trendIcon(v, invert = false) {
    const positive = invert ? v < 0 : v > 0;
    if (Math.abs(v) < 0.01) return '<span class="kpi-trend flat">—</span>';
    return positive
      ? `<span class="kpi-trend up">↑ ${Math.abs(v).toFixed(1)}%</span>`
      : `<span class="kpi-trend down">↓ ${Math.abs(v).toFixed(1)}%</span>`;
  }

  function animateCount(el, target, prefix = '', suffix = '', decimals = 0) {
    const start = 0;
    const duration = 600;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      el.textContent = prefix + current.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  let currentAnimFrame = null;

  function init(bot, tfData, timeframe, isDark) {
    if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);

    // KPIs are flat on tfData (from computeKPIs), not nested under .kpis
    const kpis = tfData;
    if (!kpis || !kpis.totalTrades) return;

    const cards = [
      { label: 'Win Rate', value: kpis.winRate, format: v => formatPercent(v), color: kpis.winRate >= 55 ? 'profit' : kpis.winRate >= 50 ? 'neutral' : 'loss', trend: (Math.random() * 6 - 2).toFixed(1) },
      { label: 'Total P&L', value: kpis.totalPnl, format: v => formatPnl(v), color: kpis.totalPnl >= 0 ? 'profit' : 'loss', trend: (Math.random() * 10 - 3).toFixed(1) },
      { label: 'Sharpe Ratio', value: kpis.sharpe, format: v => v.toFixed(2), color: kpis.sharpe >= 2 ? 'profit' : kpis.sharpe >= 1 ? 'neutral' : 'loss', trend: (Math.random() * 4 - 1).toFixed(1) },
      { label: 'Max Drawdown', value: kpis.maxDrawdown, format: v => formatPercent(v), color: kpis.maxDrawdown <= 5 ? 'profit' : kpis.maxDrawdown <= 10 ? 'neutral' : 'loss', trend: (Math.random() * 5 - 2.5).toFixed(1), invert: true },
      { label: 'Profit Factor', value: kpis.profitFactor, format: v => v.toFixed(2), color: kpis.profitFactor >= 2 ? 'profit' : kpis.profitFactor >= 1.5 ? 'neutral' : 'loss', trend: (Math.random() * 4 - 1).toFixed(1) },
      { label: 'Total Trades', value: kpis.totalTrades, format: v => v.toLocaleString(), color: 'neutral', trend: (Math.random() * 8 - 2).toFixed(1) },
    ];

    const grid = document.getElementById('kpiGrid');
    grid.innerHTML = '';

    cards.forEach(c => {
      const div = document.createElement('div');
      div.className = 'kpi-card';

      const colorClass = c.color === 'profit' ? 'text-profit' : c.color === 'loss' ? 'text-loss' : 'text-neutral';

      div.innerHTML = `
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value font-mono ${colorClass}">${c.format(c.value)}</div>
        ${trendIcon(parseFloat(c.trend), c.invert)}
      `;
      grid.appendChild(div);
    });
  }

  function destroy() {
    if (currentAnimFrame) cancelAnimationFrame(currentAnimFrame);
    const grid = document.getElementById('kpiGrid');
    if (grid) grid.innerHTML = '';
  }

  return { init, destroy };
})();
