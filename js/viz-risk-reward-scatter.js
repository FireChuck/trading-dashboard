/**
 * viz-risk-reward-scatter.js — Risk/Reward Scatter Plot
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe).trades
 */
(function() {
  'use strict';
  let _container = null;

  function fmt(v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    const trades = data?.trades || [];
    if (!trades.length) return;

    const T = window.ThemeColors ? window.ThemeColors() : {};
    const pc = T.profit || '#16A34A';
    const lc = T.loss || '#DC2626';

    const containerW = container.clientWidth || 320;
    const w = Math.min(containerW - 32, 400), h = Math.max(w * 0.75, 200);
    const pad = { t: 20, r: 20, b: 36, l: 48 };
    const maxR = Math.max(...trades.map(t => Math.abs(t.rr || 0)), 1);
    const maxP = Math.max(...trades.map(t => Math.abs(t.pnl || 0)), 1);
    const pW = w - pad.l - pad.r, pH = h - pad.t - pad.b;
    const zX = pad.l + pW / 2, zY = pad.t + pH / 2;
    const mx = (r) => pad.l + (r / maxR) * (pW / 2);
    const my = (p) => pad.t + pH / 2 - (p / maxP) * (pH / 2);

    container.innerHTML = `
      <div style="padding:16px;">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);text-align:center;margin-bottom:8px;">Risk / Reward Distribution</div>
        <div style="position:relative;width:100%;max-width:${w}px;margin:0 auto;">
          <canvas id="viz-rr-cv" width="${w}" height="${h}" style="width:100%;height:auto;cursor:crosshair;"></canvas>
          <div id="viz-rr-tip" style="display:none;position:absolute;background:var(--tooltip-bg);color:var(--tooltip-text);padding:6px 10px;border-radius:6px;font-size:11px;pointer-events:none;z-index:10;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2);"></div>
        </div>
        <div style="display:flex;justify-content:center;gap:12px;margin-top:8px;font-size:11px;color:var(--text-muted);">
          <span>X = Risk (R)</span><span>·</span><span>Y = P&L</span>
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pc};vertical-align:middle;"></span> Win
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${lc};vertical-align:middle;"></span> Loss
        </div>
      </div>`;

    const cv = container.querySelector('#viz-rr-cv');
    if (!cv) return;
    const ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);

    // Grid lines
    const gridColor = T.gridLine || 'var(--grid)';
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, zY); ctx.lineTo(w - pad.r, zY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zX, pad.t); ctx.lineTo(zX, h - pad.b); ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = T.dot || '#999'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Risk (R)', w / 2, h - 4);
    ctx.save(); ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('P&L ($)', 0, 0); ctx.restore();

    // Points
    const pts = trades.map(t => ({
      x: mx(Math.abs(t.rr || 0)),
      y: my(t.pnl || 0),
      isW: t.pnl > 0,
      t, r: Math.max(2, Math.min(6, (t.volume || 2) * 1.2)),
    }));
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.isW ? pc + '80' : lc + '80'; ctx.fill();
    });

    // Tooltip
    const tip = container.querySelector('#viz-rr-tip');
    cv.addEventListener('mousemove', (e) => {
      const rect = cv.getBoundingClientRect(), sx = w / rect.width, sy = h / rect.height;
      const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy;
      let cl = null, cd = 15;
      for (const p of pts) { const d = Math.hypot(p.x - cx, p.y - cy); if (d < cd) { cd = d; cl = p; } }
      if (cl) {
        const dateStr = cl.t.date instanceof Date ? cl.t.date.toLocaleDateString() : (cl.t.date || '');
        tip.innerHTML = `<strong>${cl.t.pair || ''} ${cl.t.direction || ''}</strong><br>${dateStr} · ${cl.t.time || ''}<br>R: ${(cl.t.rr || 0) > 0 ? '+' : ''}${(cl.t.rr || 0).toFixed(1)} · ${fmt(cl.t.pnl)}`;
        tip.style.display = 'block';
        tip.style.left = (e.clientX - rect.left + 12) + 'px';
        tip.style.top = (e.clientY - rect.top - 10) + 'px';
      } else { tip.style.display = 'none'; }
    });
    cv.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  }

  function destroy() {
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizRiskRewardScatter = { render, destroy };
})();
