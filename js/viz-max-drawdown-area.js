/**
 * viz-max-drawdown-area.js — B13: Max Drawdown Area Chart (Chart.js)
 * Downward curve, red fill, "MAX DD" watermark, max point marker.
 */
window.VizMaxDrawdownArea = (() => {
  'use strict';

  let _container = null;
  let _chart = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function theme() {
    const T = window.ThemeColors();
    return { text: T.text, muted: T.textMuted, loss: T.loss, lossFill: T.lossFill, grid: T.gridLine, wm: T.dark ? 'rgba(248,113,113,.04)' : 'rgba(220,38,38,.03)', tipBg: T.tipBg, tipBorder: T.tipBorder };
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

    const T = theme();
    const curve = data.drawdownCurve || [];
    const W = container.clientWidth || 400;
    const H = Math.max(W * 0.55, 200);

    const maxDD = Math.max(...curve.map(d => d.dd), 0);
    const maxIdx = curve.findIndex(d => d.dd === maxDD);

    container.innerHTML = `<div style="position:relative;width:100%;height:${H}px"><canvas id="ddc" width="${W}" height="${H}"></canvas><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${Math.min(W / 6, 42)}px;font-weight:900;color:${T.wm};font-family:var(--sans);letter-spacing:6px;pointer-events:none;user-select:none">MAX DD</div></div>`;
    const ctx = container.querySelector('#ddc').getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(.5, T.lossFill);
    grad.addColorStop(1, T.lossFill);

    _chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: curve.map(d => d.date.slice(5)),
        datasets: [{
          data: curve.map(d => -d.dd),
          borderColor: T.loss,
          borderWidth: 2.5,
          backgroundColor: grad,
          fill: true,
          tension: .4,
          pointRadius: curve.map((_, i) => i === maxIdx ? 6 : 0),
          pointBackgroundColor: curve.map((_, i) => i === maxIdx ? T.loss : 'transparent'),
          pointBorderColor: T.loss,
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: false,
        animation: { duration: 700, easing: 'easeOutQuart' },
        scales: {
          x: { grid: { color: T.grid, drawBorder: false }, ticks: { color: T.muted, font: { size: 10, family: 'var(--mono)' }, maxRotation: 0 }, border: { display: false } },
          y: { grid: { color: T.grid, drawBorder: false }, ticks: { color: T.muted, font: { size: 10, family: 'var(--mono)' }, callback: v => '-$' + Math.abs(v).toLocaleString() }, border: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: T.tipBg,
            titleColor: T.text,
            bodyColor: T.muted,
            cornerRadius: 8,
            padding: 10,
            borderColor: T.tipBorder,
            bodyFont: { family: 'var(--sans)', size: 12 },
            callbacks: {
              title: i => i[0].label,
              label: c => ` Drawdown: -$${Math.abs(c.parsed.y).toLocaleString()}`
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });

    setupObservers(botId, timeframe);
    } finally { _rendering = false; }
  }

  function cleanup() {
    _rendering = false;
    if (_chart) { _chart.destroy(); _chart = null; }
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
