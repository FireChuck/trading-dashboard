/**
 * viz-consecutive-streaks.js — Consecutive Win/Loss Streaks
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe).streaks + .trades
 */
(function() {
  'use strict';
  let _container = null;

  function fmt(v) {
    return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function injectStyles() {
    if (document.getElementById('viz-streaks-css')) return;
    const s = document.createElement('style');
    s.id = 'viz-streaks-css';
    s.textContent = `
      @keyframes viz-sk-enter { from { opacity:0; transform:scale(.5); } to { opacity:1; transform:scale(1); } }
    `;
    document.head.appendChild(s);
  }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;
    injectStyles();

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    const trades = data?.trades || [];
    const streaks = data?.streaks || [];
    if (!trades.length) return;

    const pc = getComputedStyle(document.documentElement).getPropertyValue('--profit').trim() || '#16A34A';
    const lc = getComputedStyle(document.documentElement).getPropertyValue('--loss').trim() || '#DC2626';

    let mW = 0, mL = 0, mWE = -1, mLE = -1, cw = 0, cl = 0;
    for (let i = 0; i < streaks.length; i++) {
      if (streaks[i].type === 'win') { cw++; cl = 0; } else { cl++; cw = 0; }
      if (cw > mW) { mW = cw; mWE = i; }
      if (cl > mL) { mL = cl; mLE = i; }
    }
    let curType = null, curLen = 0;
    for (let i = streaks.length - 1; i >= 0; i--) {
      if (!curType) curType = streaks[i].type;
      if (streaks[i].type === curType) curLen++; else break;
    }

    const recent = streaks.slice(-30);
    const rTrades = trades.slice(-30);

    const blocks = recent.map((s, i) => {
      const t = rTrades[i];
      const isW = s.type === 'win';
      const c = isW ? pc : lc;
      const isMax = (isW && i >= mWE - mW + 1 && i <= mWE) || (!isW && i >= mLE - mL + 1 && i <= mLE);
      return `<div style="width:16px;height:16px;border-radius:3px;background:${c};opacity:0;animation:viz-sk-enter .3s ${i * 25}ms ease-out forwards;${isMax ? 'border:2px solid ' + c + ';' : ''}cursor:pointer;flex-shrink:0;transition:transform .15s ease;min-width:16px;min-height:16px;" title="${t ? t.pair + ' ' + (t.direction || '') + ' ' + fmt(t.pnl) + ' (' + (t.date instanceof Date ? t.date.toLocaleDateString() : t.date) + ')' : ''}" onmouseenter="this.style.transform='scale(1.4)'" onmouseleave="this.style.transform='scale(1)'"></div>`;
    }).join('');

    container.innerHTML = `
      <div style="padding:20px;">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);text-align:center;margin-bottom:12px;">Win/Loss Streaks</div>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
          <div style="text-align:center;padding:8px 16px;background:var(--profit-bg);border-radius:8px;">
            <div style="font-size:28px;font-weight:800;color:${pc};font-variant-numeric:tabular-nums;">${mW}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;">Best Win Streak</div>
          </div>
          <div style="text-align:center;padding:8px 16px;background:var(--loss-bg);border-radius:8px;">
            <div style="font-size:28px;font-weight:800;color:${lc};font-variant-numeric:tabular-nums;">${mL}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;">Worst Loss Streak</div>
          </div>
          <div style="text-align:center;padding:8px 16px;background:var(--bg-secondary);border-radius:8px;">
            <div style="font-size:28px;font-weight:800;color:var(--text-primary);font-variant-numeric:tabular-nums;">${curLen}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);font-weight:600;">Current (${curType === 'win' ? '🔥' : '❄️'})</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text-muted);text-align:center;margin-bottom:6px;">Last ${recent.length} trades · bordered = longest streak</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;padding:8px;background:var(--bg-secondary);border-radius:8px;overflow:hidden;">${blocks}</div>
      </div>`;
  }

  function destroy() {
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizConsecutiveStreaks = { render, destroy };
})();
