/**
 * Landing Page — Cross-Bot Comparison Overview
 */
(function() {
  'use strict';
  let _c;

  function fmt(v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function pct(v) { return v.toFixed(1) + '%'; }
  function animVal(el, target, dur, pre, suf) {
    const s = performance.now();
    (function t(now) {
      const p = Math.min((now - s) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (pre || '') + Math.round(e * target).toLocaleString() + (suf || '');
      if (p < 1) requestAnimationFrame(t);
    })(s);
  }

  function render() {
    if (!_c || !window.MockDataFinal) return;
    const all = window.MockDataFinal.getAllBots();
    const colors = window.MockDataFinal.botColors;
    const names = window.MockDataFinal.botNames;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';

    const bots = [
      { id: 'alphaTrader', name: names.alphaTrader, data: all.alphaTrader, color: colors.alphaTrader },
      { id: 'trendRider', name: names.trendRider, data: all.trendRider, color: colors.trendRider },
      { id: 'scalpMaster', name: names.scalpMaster, data: all.scalpMaster, color: colors.scalpMaster }
    ].map(b => ({ ...b, tf: b.data.monthly }));

    const best = bots.reduce((a, b) => a.tf.totalPnl > b.tf.totalPnl ? a : b);

    const cards = bots.map((b, i) => {
      const pc = b.tf.totalPnl >= 0 ? 'var(--profit)' : 'var(--loss)';
      return `<div class="bot-landing-card" data-bot-id="${b.id}" style="background:var(--card-elevated-bg);border:1px solid var(--border-primary);border-radius:14px;padding:20px;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;opacity:0;animation:csu .5s ${i*120}ms ease-out forwards;position:relative;overflow:hidden;" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='${b.color.main}'" onmouseleave="this.style.transform='';this.style.boxShadow='';this.style.borderColor='var(--border-primary)'">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${b.color.main};"></div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:${b.color.bg || b.color.main + '15'};display:flex;align-items:center;justify-content:center;"><div style="width:14px;height:14px;border-radius:4px;background:${b.color.main};"></div></div>
          <div><div style="font-size:14px;font-weight:700;color:var(--text-primary);">${b.name}</div><div style="font-size:11px;color:var(--text-muted);">${b.tf.totalTrades} trades</div></div>
        </div>
        <div style="font-size:26px;font-weight:800;color:${pc};font-variant-numeric:tabular-nums;margin-bottom:8px;" data-av="${b.tf.totalPnl}">$0</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;">Win Rate</div><div style="font-size:14px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;">${pct(b.tf.winRate)}</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;">Sharpe</div><div style="font-size:14px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;">${b.tf.sharpe.toFixed(2)}</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;">Profit Factor</div><div style="font-size:14px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;">${b.tf.profitFactor.toFixed(2)}</div></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;">Max DD</div><div style="font-size:14px;font-weight:700;color:var(--loss);font-variant-numeric:tabular-nums;">-${'$' + b.tf.maxDD.toLocaleString()}</div></div>
        </div>
      </div>`;
    }).join('');

    const kpiRows = [
      { l: 'Total P&L', k: 'totalPnl', f: v => fmt(v), b: 'max' },
      { l: 'Win Rate', k: 'winRate', f: v => pct(v), b: 'max' },
      { l: 'Sharpe Ratio', k: 'sharpe', f: v => v.toFixed(2), b: 'max' },
      { l: 'Profit Factor', k: 'profitFactor', f: v => v.toFixed(2), b: 'max' },
      { l: 'Max Drawdown', k: 'maxDD', f: v => '-$' + v.toLocaleString(), b: 'min' },
      { l: 'Total Trades', k: 'totalTrades', f: v => '' + v, b: null },
      { l: 'Best Win Streak', k: 'maxWinStreak', f: v => '' + v, b: 'max' }
    ];

    const kpiBody = kpiRows.map(r => {
      const vals = bots.map(s => s.tf[r.k]);
      const bv = r.b === 'max' ? Math.max(...vals) : r.b === 'min' ? Math.min(...vals) : null;
      const cells = bots.map(s => {
        const v = s.tf[r.k], ib = bv !== null && v === bv;
        return `<td style="padding:8px 12px;font-variant-numeric:tabular-nums;font-weight:${ib?'700':'400'};color:${ib?s.color.main:'var(--text-primary)'};font-size:13px;text-align:right;border-bottom:1px solid var(--border-subtle);transition:background-color .2s ease,border-color .2s ease;">${r.f(v)}</td>`;
      }).join('');
      return `<tr><td style="padding:8px 12px;font-size:12px;color:var(--text-secondary);font-weight:600;border-bottom:1px solid var(--border-subtle);transition:background-color .2s ease;">${r.l}</td>${cells}</tr>`;
    }).join('');

    const thCells = bots.map(s => `<th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:${s.color.main};font-weight:700;border-bottom:1px solid var(--border-primary);transition:background-color .2s ease;">${s.name}</th>`).join('');

    _c.innerHTML = `<style>
      @keyframes csu{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes hfi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes cpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      .lt{width:100%;border-collapse:collapse;table-layout:fixed;}
      @media(max-width:768px){.bcg{grid-template-columns:1fr!important;}}
      @media(min-width:769px) and (max-width:1024px){.bcg{grid-template-columns:1fr 1fr!important;}}
    </style>
    <div style="max-width:960px;margin:0 auto;padding:24px 16px;">
      <div style="text-align:center;padding:32px 0 24px;opacity:0;animation:hfi .6s 0ms ease-out forwards;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:8px;">Multi-Bot Analytics</div>
        <h1 style="font-size:32px;font-weight:800;color:var(--text-primary);margin:0 0 6px;letter-spacing:-.02em;">Trading Performance Dashboard</h1>
        <p style="font-size:14px;color:var(--text-secondary);margin:0;">Comparative analytics across all trading strategies</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;" class="bcg">${cards}</div>
      <div style="margin-bottom:32px;opacity:0;animation:hfi .5s 400ms ease-out forwards;">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em;">KPI Comparison</div>
        <div style="background:var(--card-elevated-bg);border:1px solid var(--border-primary);border-radius:12px;overflow:hidden;">
          <table class="lt"><thead><tr><th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border-primary);">Metric</th>${thCells}</tr></thead><tbody>${kpiBody}</tbody></table>
        </div>
      </div>
      <div style="margin-bottom:32px;opacity:0;animation:hfi .5s 600ms ease-out forwards;">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em;">Equity Curve Comparison</div>
        <div style="background:var(--card-elevated-bg);border:1px solid var(--border-primary);border-radius:12px;padding:20px;">
          <canvas id="eqCv" width="900" height="280" style="width:100%;height:auto;"></canvas>
          <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:11px;">
            ${bots.map(s => `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--text-muted);"><span style="width:10px;height:10px;border-radius:50%;background:${s.color.main};"></span>${s.name}</span>`).join('')}
          </div>
        </div>
      </div>
      <div style="opacity:0;animation:hfi .5s 800ms ease-out forwards;">
        <div style="background:${best.color.main}10;border:2px solid ${best.color.main}40;border-radius:14px;padding:24px;text-align:center;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-20px;right:-10px;font-size:48px;opacity:.08;animation:cpulse 3s ease-in-out infinite;">👑</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${best.color.main};margin-bottom:6px;">Best Performer</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">${best.name}</div>
          <div style="font-size:32px;font-weight:800;color:${best.tf.totalPnl >= 0 ? 'var(--profit)' : 'var(--loss)'};font-variant-numeric:tabular-nums;" data-av="${best.tf.totalPnl}">$0</div>
          <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;font-size:12px;color:var(--text-secondary);">
            <span><strong style="color:var(--text-primary);">${pct(best.tf.winRate)}</strong> Win Rate</span>
            <span><strong style="color:var(--text-primary);">${best.tf.sharpe.toFixed(2)}</strong> Sharpe</span>
            <span><strong style="color:var(--text-primary);">${best.tf.profitFactor.toFixed(2)}</strong> PF</span>
            <span><strong style="color:var(--text-primary);">${best.tf.maxWinStreak}</strong> Best Streak</span>
          </div>
        </div>
      </div>
    </div>`;

    setTimeout(() => {
      _c.querySelectorAll('[data-av]').forEach(el => {
        const v = parseFloat(el.dataset.av);
        animVal(el, Math.abs(v), 1200, v >= 0 ? '+$' : '-$', '');
      });
      // Bind click → navigate to dashboard with selected bot
      const idMap = { alphaTrader: 'alpha-trader', trendRider: 'trend-rider', scalpMaster: 'scalp-master' };
      _c.querySelectorAll('.bot-landing-card').forEach(card => {
        card.addEventListener('click', () => {
          const botId = idMap[card.dataset.botId];
          if (!botId || !window.App) return;
          window.App.showDashboard();
          // Click the matching bot-tab to switch
          const botTabBtns = document.querySelectorAll('.bot-tab');
          botTabBtns.forEach(btn => {
            if (btn.textContent.trim() === (window.MOCK_DATA && window.MOCK_DATA.bots[botId] ? window.MOCK_DATA.bots[botId].name : botId)) {
              btn.click();
            }
          });
        });
      });
    }, 300);

    drawEquity(bots, dark);
  }

  function drawEquity(bots, dark) {
    const cv = _c.querySelector('#eqCv'); if (!cv) return;
    const ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
    const w = 900, h = 280; cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);
    const pad = { t: 20, r: 20, b: 30, l: 50 };
    const pW = w - pad.l - pad.r, pH = h - pad.t - pad.b;
    let all = []; bots.forEach(s => all.push(...s.tf.equity));
    const min = Math.min(...all, 0), max = Math.max(...all, 0), range = Math.max(max - min, 1);
    const mX = (i, n) => pad.l + (i / Math.max(n - 1, 1)) * pW;
    const mY = (v) => pad.t + pH - ((v - min) / range) * pH;

    const zY = mY(0);
    ctx.strokeStyle = dark ? '#333' : '#E7E5E4'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, zY); ctx.lineTo(w - pad.r, zY); ctx.stroke(); ctx.setLineDash([]);

    ctx.fillStyle = dark ? '#666' : '#999'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const v = min + range * i / 5, y = mY(v);
      ctx.fillText('$' + Math.round(v).toLocaleString(), pad.l - 6, y + 3);
      if (i > 0 && i < 5) { ctx.strokeStyle = dark ? '#1E1F22' : '#F5F5F4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
    }

    bots.forEach(s => {
      const eq = s.tf.equity, n = eq.length; if (n < 2) return;
      const g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      g.addColorStop(0, s.color.main + '15'); g.addColorStop(1, s.color.main + '02');
      ctx.beginPath(); ctx.moveTo(mX(0, n), mY(eq[0]));
      for (let i = 1; i < n; i++) ctx.lineTo(mX(i, n), mY(eq[i]));
      ctx.lineTo(mX(n - 1, n), h - pad.b); ctx.lineTo(mX(0, n), h - pad.b); ctx.closePath(); ctx.fillStyle = g; ctx.fill();

      ctx.beginPath(); ctx.moveTo(mX(0, n), mY(eq[0]));
      for (let i = 1; i < n; i++) ctx.lineTo(mX(i, n), mY(eq[i]));
      ctx.strokeStyle = s.color.main; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

      const lx = mX(n - 1, n), ly = mY(eq[n - 1]);
      ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fillStyle = s.color.main; ctx.fill();
      ctx.fillStyle = s.color.main; ctx.font = 'bold 10px -apple-system,sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(s.name, lx + 8, ly + 3);
    });
  }

  window.LandingPage = {
    init(c) { _c = c; render(); },
    destroy() { if (_c) _c.innerHTML = ''; _c = null; },
    update() { render(); }
  };
})();
