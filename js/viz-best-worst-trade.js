/**
 * viz-best-worst-trade.js — Best & Worst Trade Cards
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe).bestTrade / .worstTrade
 */
(function() {
  'use strict';
  let _container = null;
  let _raf = null;

  function ease(t) { return 1 - Math.pow(1 - t, 4); }
  function fmt(v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    const bestTrade = data?.bestTrade;
    const worstTrade = data?.worstTrade;
    if (!bestTrade || !worstTrade) return;

    const T = window.ThemeColors ? window.ThemeColors() : {};
    const pc = T.profit || 'var(--profit)';
    const lc = T.loss || 'var(--loss)';

    const mkCard = (trade, type) => {
      const isBest = type === 'best';
      const color = isBest ? pc : lc;
      const bgVar = isBest ? 'var(--profit-bg)' : 'var(--loss-bg)';
      const dateStr = trade.date instanceof Date ? trade.date.toLocaleDateString() : (trade.date || '');
      return `<div style="background:${bgVar};border-radius:12px;padding:16px;overflow:hidden;min-width:0;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${color};margin-bottom:8px;">${isBest ? 'Best' : 'Worst'} Trade</div>
        <canvas class="viz-bwc-${type}" width="200" height="70" style="width:100%;height:70px;max-width:100%;"></canvas>
        <div style="font-size:24px;font-weight:800;color:${color};margin-top:8px;font-variant-numeric:tabular-nums;">${fmt(trade.pnl)}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${trade.pair || trade.symbol || ''} · ${trade.direction || ''} · ${dateStr}</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${(trade.entry || 0).toFixed(2)} → ${(trade.exit || 0).toFixed(2)}</div>
      </div>`;
    };

    container.innerHTML = `
      <div style="padding:20px;">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);text-align:center;margin-bottom:16px;">Best & Worst Trade</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${mkCard(bestTrade, 'best')}${mkCard(worstTrade, 'worst')}</div>
      </div>`;

    drawCurve(container, '.viz-bwc-best', bestTrade, pc, T);
    drawCurve(container, '.viz-bwc-worst', worstTrade, lc, T);
  }

  function drawCurve(root, sel, t, color, themeObj) {
    const cv = root.querySelector(sel);
    if (!cv) return;
    const ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
    const w = 200, h = 70;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);

    const minY = Math.min(t.entry || 0, t.exit || 0), maxY = Math.max(t.entry || 0, t.exit || 0);
    const range = Math.max(maxY - minY, 1);
    const sX = 20, eX = w - 20, pY = 10;
    const sY = h - pY - ((t.entry - minY) / range) * (h - pY * 2);
    const eY = h - pY - ((t.exit - minY) / range) * (h - pY * 2);
    const cpY = t.pnl > 0 ? Math.min(sY, eY) - 12 : Math.max(sY, eY) + 12;

    const t0 = performance.now();
    function draw(now) {
      const p = Math.min((now - t0) / 1000, 1), e = ease(p);
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(sX, 0, sX + (eX - sX) * e, 0);
      g.addColorStop(0, color + '40'); g.addColorStop(1, color);
      const steps = Math.floor(e * 30);
      ctx.beginPath(); ctx.moveTo(sX, sY);
      for (let i = 1; i <= steps; i++) {
        const tt = i / 30;
        ctx.lineTo(
          (1-tt)*(1-tt)*sX + 2*(1-tt)*tt*(sX+eX)/2 + tt*tt*eX,
          (1-tt)*(1-tt)*sY + 2*(1-tt)*tt*cpY + tt*tt*eY
        );
      }
      ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(sX, sY, 4, 0, Math.PI * 2);
      ctx.fillStyle = themeObj.dot || '#999'; ctx.fill();
      if (p < 1) {
        _raf = requestAnimationFrame(draw);
      } else {
        ctx.beginPath(); ctx.arc(eX, eY, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
    }
    _raf = requestAnimationFrame(draw);
  }

  function destroy() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizBestWorstTrade = { render, destroy };
})();
