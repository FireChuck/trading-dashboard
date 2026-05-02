/**
 * B16: Total Trades — Animated Counter + Sparkline
 */
window.VizTotalTrades = (() => {
  'use strict';

  let _container = null;
  let _raf = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

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
    const accent = T.accent;

    const trades = data.trades || [];
    const buckets = {};
    trades.forEach(t => { const d = t.date; buckets[d] = (buckets[d] || 0) + 1; });
    const dates = Object.keys(buckets).sort().slice(-12);
    const spark = dates.map(d => ({ l: d.slice(5), v: buckets[d] }));
    const maxS = Math.max(...spark.map(d => d.v), 1);

    const sparkW = Math.min(container.clientWidth - 40, 280);
    container.innerHTML = `<div style="text-align:center;padding:20px;">
      <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin-bottom:8px;">Total Trades</div>
      <div class="tt-num" style="font-size:56px;font-weight:800;font-variant-numeric:tabular-nums;color:${accent};line-height:1;margin-bottom:4px;">0</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">${data.winCount} wins · ${data.lossCount} losses · ${data.winRate.toFixed(1)}% WR</div>
      <canvas class="tt-spark" width="${sparkW}" height="48" style="width:100%;max-width:${sparkW}px;height:48px;"></canvas>
    </div>`;

    if (_raf) cancelAnimationFrame(_raf);
    const start = performance.now();
    (function anim(now) {
      const p = Math.min((now - start) / 1200, 1);
      const el = container.querySelector('.tt-num');
      if (el) el.textContent = Math.round(ease(p) * data.totalTrades).toLocaleString();
      if (p < 1) _raf = requestAnimationFrame(anim);
    })(start);

    const cv = container.querySelector('.tt-spark');
    if (cv && spark.length > 1) {
      const ctx = cv.getContext('2d');
      const dpr = devicePixelRatio || 1;
      cv.width = sparkW * dpr;
      cv.height = 48 * dpr;
      ctx.scale(dpr, dpr);
      const w = sparkW, h = 48, pad = 4, sx = (w - pad * 2) / (spark.length - 1);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, accent + '40');
      g.addColorStop(1, accent + '08');
      ctx.beginPath();
      ctx.moveTo(pad, h - pad);
      spark.forEach((d, i) => ctx.lineTo(pad + i * sx, h - pad - (d.v / maxS) * (h - pad * 2)));
      ctx.lineTo(pad + (spark.length - 1) * sx, h - pad);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      spark.forEach((d, i) => {
        const x = pad + i * sx, y = h - pad - (d.v / maxS) * (h - pad * 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      spark.forEach((d, i) => {
        ctx.beginPath();
        ctx.arc(pad + i * sx, h - pad - (d.v / maxS) * (h - pad * 2), 2.5, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
      });
    }

    setupObservers(botId, timeframe);
    } finally { _rendering = false; }
  }

  function cleanup() {
    _rendering = false;
    if (_raf) cancelAnimationFrame(_raf);
    _raf = null;
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
