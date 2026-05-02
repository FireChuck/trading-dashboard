// viz-pnl-by-pair.js — A4: Grouped Bar Chart (Win/Loss/Total by Pair)
window.VizPnlByPair = (() => {
  let _container = null;
  let _chart = null;
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

    const pairPnl = data.pairPnl || [];
    if (!pairPnl.length) return;

    const T = window.ThemeColors();
    const labels = pairPnl.map(p => p.pair);
    const colors = {
      win: T.profit,
      loss: T.loss,
      total: T.accent,
    };

    const W = container.clientWidth || 400;
    const H = Math.max(W * 0.55, 200);

    container.innerHTML = `<div style="position:relative;width:100%;height:${H}px"><canvas width="${W}" height="${H}"></canvas></div>`;
    const ctx = container.querySelector('canvas').getContext('2d');

    _chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Win P&L', data: pairPnl.map(p => p.winPnl), backgroundColor: colors.win, borderRadius: 3, barPercentage: 0.7 },
          { label: 'Loss P&L', data: pairPnl.map(p => Math.abs(p.lossPnl)), backgroundColor: colors.loss, borderRadius: 3, barPercentage: 0.7 },
          { label: 'Net P&L', data: pairPnl.map(p => p.totalPnl), backgroundColor: colors.total, borderRadius: 3, barPercentage: 0.7 },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            display: true, position: 'top', align: 'end',
            labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 10 }, color: T.textMuted, padding: 12 },
          },
          tooltip: {
            backgroundColor: T.tipBg, titleColor: T.text, bodyColor: T.textMuted,
            borderColor: T.tipBorder, borderWidth: 1, padding: 10,
            bodyFont: { family: "'SF Mono', monospace", size: 12 },
            callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: T.textMuted, font: { family: "'SF Mono', monospace", size: 11 } } },
          y: {
            grid: { color: T.grid, drawBorder: false },
            ticks: { color: T.textMuted, font: { family: "'SF Mono', monospace", size: 10 }, callback: v => '$' + v.toLocaleString() },
          },
        },
      },
    });

    setupObservers(botId, timeframe);
    } finally { _rendering = false; }
  }

  function cleanup() {
    _rendering = false;
    if (_chart) { _chart.destroy(); _chart = null; }
    if (_ro) { _ro.disconnect(); _ro = null; }
    if (_themeObs) { _themeObs.disconnect(); _themeObs = null; }
    if (_container) { _container.innerHTML = ""; }
    _container = null;
  }

  function setupObservers(botId, timeframe) {
    if (!_container) return;
    _ro = new ResizeObserver(() => render(_container, botId, timeframe));
    _ro.observe(_container);
    _themeObs = new MutationObserver(() => render(_container, botId, timeframe));
    _themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function update(botId, timeframe) {
    _lastBotId = botId;
    _lastTimeframe = timeframe;
    render(_container, botId, timeframe);
  }

  return { render, update, destroy: cleanup };
})();
