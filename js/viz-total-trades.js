/**
 * B16: Total Trades — Animated Counter + Sparkline
 */
(function() {
  'use strict';
  let _c, _raf;
  function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function render(tf, botId) {
    if (!_c) return;
    const T = window.ThemeColors();
    const dark = T.dark;
    const cols = window.MockDataFinal?.botColors?.[botId] || { main: '#3B82F6', light: '#93C5FD', dark: '#1E40AF' };
    const accent = dark ? cols.light : cols.dark;
    const trades = tf.trades || [];
    const buckets = {}; trades.forEach(t => { const d = t.date; buckets[d] = (buckets[d] || 0) + 1; });
    const dates = Object.keys(buckets).sort().slice(-12);
    const spark = dates.map(d => ({ l: d.slice(5), v: buckets[d] }));
    const maxS = Math.max(...spark.map(d => d.v), 1);

    _c.innerHTML = `<div style="text-align:center;padding:20px;">
      <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);margin-bottom:8px;">Total Trades</div>
      <div class="tt-num" style="font-size:56px;font-weight:800;font-variant-numeric:tabular-nums;color:${accent};line-height:1;margin-bottom:4px;">0</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">${tf.wins} wins · ${tf.losses} losses · ${tf.winRate.toFixed(1)}% WR</div>
      <canvas class="tt-spark" width="280" height="48" style="width:100%;max-width:280px;height:48px;"></canvas>
    </div>`;

    if (_raf) cancelAnimationFrame(_raf);
    const start = performance.now();
    (function anim(now) {
      const p = Math.min((now - start) / 1200, 1);
      const el = _c.querySelector('.tt-num');
      if (el) el.textContent = Math.round(ease(p) * tf.totalTrades).toLocaleString();
      if (p < 1) _raf = requestAnimationFrame(anim);
    })(start);

    const cv = _c.querySelector('.tt-spark');
    if (cv && spark.length > 1) {
      const ctx = cv.getContext('2d');
      const dpr = devicePixelRatio || 1; cv.width = 280 * dpr; cv.height = 48 * dpr; ctx.scale(dpr, dpr);
      const w = 280, h = 48, pad = 4, sx = (w - pad * 2) / (spark.length - 1);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, cols.main + (dark ? '30' : '18'));
      g.addColorStop(1, cols.main + (dark ? '05' : '02'));
      ctx.beginPath(); ctx.moveTo(pad, h - pad);
      spark.forEach((d, i) => ctx.lineTo(pad + i * sx, h - pad - (d.v / maxS) * (h - pad * 2)));
      ctx.lineTo(pad + (spark.length - 1) * sx, h - pad); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath();
      spark.forEach((d, i) => { const x = pad + i * sx, y = h - pad - (d.v / maxS) * (h - pad * 2); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.strokeStyle = cols.main; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      spark.forEach((d, i) => { ctx.beginPath(); ctx.arc(pad + i * sx, h - pad - (d.v / maxS) * (h - pad * 2), 2.5, 0, Math.PI * 2); ctx.fillStyle = cols.main; ctx.fill(); });
    }
  }

  window.VizTotalTrades = {
    init(c, bd, tf) { _c = c; render(bd[tf] || bd, bd._botId || 'momentumAlpha'); },
    destroy() { if (_raf) cancelAnimationFrame(_raf); if (_c) _c.innerHTML = ''; _c = null; },
    update(bd, tf) { render(bd[tf] || bd, bd._botId || 'momentumAlpha'); }
  };
})();
