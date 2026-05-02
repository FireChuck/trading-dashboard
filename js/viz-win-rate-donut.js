/**
 * viz-win-rate-donut.js — B11: Win Rate Donut (Chart.js)
 * Center text = Win Rate %. Animated, responsive.
 */
window.VizWinRateDonut = (() => {
  let _container = null;
  let _chart = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function theme() {
    const T = window.ThemeColors();
    return { text: T.text, muted: T.textMuted, profit: T.profit, loss: T.loss, tipBg: T.tipBg, tipBorder: T.tipBorder };
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
    const wr = data.winRate || 0;
    const lr = 100 - wr;
    const W = container.clientWidth || 300;
    const H = Math.max(W * 0.75, 220);

    container.innerHTML = `<div style="position:relative;width:100%;height:${H}px"><canvas id="wrd" width="${W}" height="${H}"></canvas><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none"><div style="font-size:${Math.min(W / 5, 32)}px;font-weight:800;color:${T.text};font-family:var(--sans);line-height:1">${wr.toFixed(1)}%</div><div style="font-size:11px;color:${T.muted};font-family:var(--sans);margin-top:2px">Win Rate</div></div></div>`;
    const ctx = container.querySelector('#wrd').getContext('2d');

    _chart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['Wins', 'Losses'], datasets: [{ data: [wr, lr], backgroundColor: [T.profit, T.loss], borderWidth: 0, borderRadius: 6, spacing: 3 }] },
      options: {
        responsive: false,
        cutout: '72%',
        animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: T.tipBg,
            titleColor: T.text,
            bodyColor: T.textMuted,
            cornerRadius: 8,
            padding: 10,
            borderColor: T.tipBorder,
            bodyFont: { family: 'var(--sans)', size: 12 },
            callbacks: { label: c => ` ${c.label}: ${c.parsed.toFixed(1)}%` }
          }
        }
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
