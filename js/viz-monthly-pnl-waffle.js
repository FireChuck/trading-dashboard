/**
 * B20: Monthly P&L — Waffle Chart
 */
(function() {
  'use strict';
  let _c;
  function fmt(v) { return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

  function render(tf) {
    if (!_c || !tf.monthlyPnl || !Object.keys(tf.monthlyPnl).length) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const pc = getComputedStyle(document.documentElement).getPropertyValue('--profit').trim() || '#16A34A';
    const lc = getComputedStyle(document.documentElement).getPropertyValue('--loss').trim() || '#DC2626';
    const months = Object.keys(tf.monthlyPnl).sort();
    const total = months.reduce((s, m) => s + tf.monthlyPnl[m], 0);
    const maxAbs = Math.max(...months.map(m => Math.abs(tf.monthlyPnl[m])), 1);
    const sq = 10;

    const rows = months.map((m, mi) => {
      const v = tf.monthlyPnl[m], isP = v >= 0, color = isP ? pc : lc;
      const filled = Math.max(1, Math.round((Math.abs(v) / maxAbs) * sq));
      const label = new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' });
      let blocks = '';
      for (let i = 0; i < sq; i++) {
        const f = i < filled, bg = f ? color : (dark ? '#222326' : '#F0EEEC');
        blocks += `<div style="width:16px;height:16px;border-radius:3px;background:${bg};opacity:0;animation:wi .25s ${mi*60+i*30}ms ease-out forwards;transition:transform .1s ease;cursor:default;" title="${label}: ${fmt(v)}" onmouseenter="this.style.transform='scale(1.2)'" onmouseleave="this.style.transform='scale(1)'"></div>`;
      }
      return `<div style="display:flex;align-items:center;gap:8px;">
        <div style="width:32px;font-size:10px;font-weight:600;color:var(--text-secondary);text-align:right;">${label}</div>
        <div style="display:flex;gap:3px;">${blocks}</div>
        <div style="width:56px;font-size:11px;font-weight:700;color:${color};text-align:left;font-variant-numeric:tabular-nums;">${fmt(v)}</div>
      </div>`;
    }).join('');

    _c.innerHTML = `<style>@keyframes wi{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}</style>
    <div style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary);">Monthly P&L</div>
        <div style="font-size:18px;font-weight:800;color:${total >= 0 ? pc : lc};font-variant-numeric:tabular-nums;">${fmt(total)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;padding:12px;background:var(--bg-secondary);border-radius:10px;">${rows}</div>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:8px;font-size:10px;color:var(--text-muted);">
        <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:${pc};"></span> Profit</span>
        <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:2px;background:${lc};"></span> Loss</span>
        <span>· 10 squares = max month</span>
      </div>
    </div>`;
  }

  window.VizMonthlyPnlWaffle = {
    init(c, bd, tf) { _c = c; render(bd[tf] || bd); },
    destroy() { if (_c) _c.innerHTML = ''; _c = null; },
    update(bd, tf) { render(bd[tf] || bd); }
  };
})();
