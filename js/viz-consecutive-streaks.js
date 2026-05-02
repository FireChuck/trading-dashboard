/**
 * B18: Consecutive Wins/Losses — Streak Visualizer
 */
(function() {
  'use strict';
  let _c;
  function fmt(v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function render(tf) {
    if (!_c || !tf.streaks || !tf.trades.length) return;
    const pc = getComputedStyle(document.documentElement).getPropertyValue('--profit').trim() || '#16A34A';
    const lc = getComputedStyle(document.documentElement).getPropertyValue('--loss').trim() || '#DC2626';
    let mW = 0, mL = 0, mWE = -1, mLE = -1, cw = 0, cl = 0;
    for (let i = 0; i < tf.streaks.length; i++) {
      if (tf.streaks[i].type === 'win') { cw++; cl = 0; } else { cl++; cw = 0; }
      if (cw > mW) { mW = cw; mWE = i; }
      if (cl > mL) { mL = cl; mLE = i; }
    }
    let curType = null, curLen = 0;
    for (let i = tf.streaks.length - 1; i >= 0; i--) { if (!curType) curType = tf.streaks[i].type; if (tf.streaks[i].type === curType) curLen++; else break; }

    const recent = tf.streaks.slice(-30), rTrades = tf.trades.slice(-30);
    const blocks = recent.map((s, i) => {
      const t = rTrades[i]; const isW = s.type === 'win';
      const c = isW ? pc : lc;
      const isMax = (isW && i >= mWE - mW + 1 && i <= mWE) || (!isW && i >= mLE - mL + 1 && i <= mLE);
      const isCur = i >= recent.length - curLen;
      return `<div style="width:16px;height:16px;border-radius:3px;background:${c};opacity:0;animation:sfi .3s ${i*25}ms ease-out forwards;${isMax ? 'border:2px solid ' + c + ';' : ''}cursor:pointer;flex-shrink:0;transition:transform .15s ease;min-width:16px;min-height:16px;" title="${t ? t.symbol + ' ' + t.direction + ' ' + fmt(t.pnl) + ' (' + t.date + ')' : ''}" onmouseenter="this.style.transform='scale(1.4)'" onmouseleave="this.style.transform='scale(1)'"></div>`;
    }).join('');

    _c.innerHTML = `<style>@keyframes sfi{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}</style>
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

  window.VizConsecutiveStreaks = {
    init(c, bd, tf) { _c = c; render(bd[tf] || bd); },
    destroy() { if (_c) _c.innerHTML = ''; _c = null; },
    update(bd, tf) { render(bd[tf] || bd); }
  };
})();
