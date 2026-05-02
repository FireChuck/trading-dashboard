// viz-equity-curve.js — A2: Equity Curve with Drawdown Overlay
window.VizEquityCurve = (() => {
  let _container = null;
  let _chart = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function getChartColors() {
    const T = window.ThemeColors();
    return {
      line: T.accent,
      lineBg: T.dark ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.06)',
      ddLine: T.loss,
      ddBg: T.lossFill,
      grid: T.grid,
      text: T.textMuted,
      tipBg: T.tipBg,
      tipBorder: T.tipBorder,
      tipTitle: T.text,
      tipBody: T.textMuted,
    };
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

    const equityCurve = data.equityCurve || [];
    if (!equityCurve.length) return;

    const W = container.clientWidth || 400;
    const H = Math.max(W * 0.55, 200);

    container.innerHTML = `<div style="position:relative;width:100%;height:${H}px"><canvas width="${W}" height="${H}"></canvas></div>`;
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    let peak = -Infinity;
    const drawdowns = equityCurve.map(p => {
      if (p.equity > peak) peak = p.equity;
      const dd = ((peak - p.equity) / peak) * 100;
      return { date: p.date, dd };
    });

    const labels = equityCurve.map(p => {
      const d = new Date(p.date);
      return timeframe === 'daily' ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : timeframe === 'weekly' ? `W${d.getDate()}`
        : d.toLocaleDateString('en-US', { month: 'short' });
    });

    const colors = getChartColors();

    _chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Equity',
            data: equityCurve.map(p => p.equity),
            borderColor: colors.line,
            backgroundColor: colors.lineBg,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHitRadius: 8,
            yAxisID: 'y',
          },
          {
            label: 'Drawdown %',
            data: drawdowns.map(d => -d.dd),
            borderColor: colors.ddLine,
            backgroundColor: colors.ddBg,
            borderWidth: 1.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHitRadius: 8,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tipBg,
            titleColor: colors.tipTitle,
            bodyColor: colors.tipBody,
            borderColor: colors.tipBorder,
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            boxPadding: 4,
            bodyFont: { family: "'SF Mono', 'Cascadia Code', monospace", size: 12 },
            callbacks: {
              label: ctx => {
                if (ctx.datasetIndex === 0) return `Equity: $${ctx.parsed.y.toLocaleString()}`;
                return `DD: ${ctx.parsed.y.toFixed(1)}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: colors.grid, drawBorder: false },
            ticks: { color: colors.text, font: { size: 10 }, maxTicksLimit: 8 },
          },
          y: {
            position: 'left',
            grid: { color: colors.grid, drawBorder: false },
            ticks: {
              color: colors.text,
              font: { family: "'SF Mono', monospace", size: 10 },
              callback: v => '$' + (v / 1000).toFixed(1) + 'k',
            },
          },
          y1: {
            position: 'right',
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { family: "'SF Mono', monospace", size: 10 },
              callback: v => v.toFixed(0) + '%',
            },
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
