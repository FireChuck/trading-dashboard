/**
 * B19: Risk/Reward Distribution — Scatter Plot
 */
(function() {
  'use strict';
  let _c;
  function fmt(v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render(tf, botId) {
    if (!_c || !tf.trades || !tf.trades.length) return;
    const T = window.ThemeColors();
    const dark = T.dark;
    const cols = window.MockDataFinal?.botColors?.[botId] || { main: '#3B82F6' };
    const pc = T.profit;
    const lc = T.loss;
    const containerW = _c.clientWidth || 320;
    const w = Math.min(containerW - 32, 400), h = Math.max(w * 0.75, 200), pad = { t: 20, r: 20, b: 36, l: 48 };
    const trades = tf.trades;
    const maxR = Math.max(...trades.map(t => Math.abs(t.r_multiple)), 1);
    const maxP = Math.max(...trades.map(t => Math.abs(t.pnl)), 1);
    const pW = w - pad.l - pad.r, pH = h - pad.t - pad.b;
    const zX = pad.l + pW / 2, zY = pad.t + pH / 2;
    const mx = (r) => pad.l + (r / maxR) * (pW / 2);
    const my = (p) => pad.t + pH / 2 - (p / maxP) * (pH / 2);

    _c.innerHTML = `<div style="padding:16px;">
      <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);text-align:center;margin-bottom:8px;">Risk / Reward Distribution</div>
      <div style="position:relative;width:100%;max-width:${w}px;margin:0 auto;">
        <canvas id="rrCv" width="${w}" height="${h}" style="width:100%;height:auto;cursor:crosshair;"></canvas>
        <div id="rrTip" style="display:none;position:absolute;background:var(--tooltip-bg);color:var(--tooltip-text);padding:6px 10px;border-radius:6px;font-size:11px;pointer-events:none;z-index:10;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2);"></div>
      </div>
      <div style="display:flex;justify-content:center;gap:12px;margin-top:8px;font-size:11px;color:var(--text-muted);">
        <span>X = Risk (R)</span><span>·</span><span>Y = P&L</span>
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pc};vertical-align:middle;"></span> Win
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${lc};vertical-align:middle;"></span> Loss
      </div>
    </div>`;

    const cv = _c.querySelector('#rrCv'); if (!cv) return;
    const ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);

    ctx.strokeStyle = T.gridLine; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, zY); ctx.lineTo(w - pad.r, zY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zX, pad.t); ctx.lineTo(zX, h - pad.b); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = T.dot; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Risk (R)', w / 2, h - 4);
    ctx.save(); ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('P&L ($)', 0, 0); ctx.restore();

    const pts = trades.map(t => ({ x: mx(Math.abs(t.r_multiple)), y: my(t.pnl), isW: t.pnl > 0, t, r: Math.max(2, Math.min(6, (t.volume || 2) * 1.2)) }));
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.isW ? pc + '80' : lc + '80'; ctx.fill(); });

    const tip = _c.querySelector('#rrTip');
    cv.addEventListener('mousemove', (e) => {
      const rect = cv.getBoundingClientRect(), sx = w / rect.width, sy = h / rect.height;
      const mx2 = (e.clientX - rect.left) * sx, my2 = (e.clientY - rect.top) * sy;
      let cl = null, cd = 15;
      for (const p of pts) { const d = Math.hypot(p.x - mx2, p.y - my2); if (d < cd) { cd = d; cl = p; } }
      if (cl) { tip.innerHTML = `<strong>${cl.t.symbol} ${cl.t.direction}</strong><br>${cl.t.date} · ${cl.t.time}<br>R: ${cl.t.r_multiple > 0 ? '+' : ''}${cl.t.r_multiple.toFixed(1)} · ${fmt(cl.t.pnl)}`;
        tip.style.display = 'block'; tip.style.left = (e.clientX - rect.left + 12) + 'px'; tip.style.top = (e.clientY - rect.top - 10) + 'px';
      } else tip.style.display = 'none';
    });
    cv.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  }

  window.VizRiskRewardScatter = {
    init(c, bd, tf) { _c = c; render(bd[tf] || bd, bd._botId || 'momentumAlpha'); },
    destroy() { if (_c) _c.innerHTML = ''; _c = null; },
    update(bd, tf) { render(bd[tf] || bd, bd._botId || 'momentumAlpha'); }
  };
})();
