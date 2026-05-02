// viz-session-analytics.js — A7: Performance by Session (Horizontal Bars)
window.VizSessionAnalytics = (() => {

  function init(bot, tfData, timeframe, isDark) {
    const container = document.getElementById('sessionContainer');
    if (!container) return;

    const stats = tfData.sessionStats || [];
    if (!stats.length) {
      container.innerHTML = '<div style="color:var(--text-secondary);font-size:var(--text-sm);padding:16px;">No session data</div>';
      return;
    }

    // Find max abs pnl for bar width scaling
    const maxPnl = Math.max(...stats.map(s => Math.abs(s.pnl)), 1);

    container.innerHTML = '';

    stats.forEach(s => {
      const row = document.createElement('div');
      row.className = 'session-bar-row';

      const pnlColor = s.pnl >= 0 ? 'var(--profit)' : 'var(--loss)';
      const barWidth = Math.max(2, (Math.abs(s.pnl) / maxPnl) * 100);
      const pnlText = (s.pnl >= 0 ? '+$' : '-$') + Math.abs(s.pnl).toLocaleString();

      row.innerHTML = `
        <div class="session-bar-label">${s.session}</div>
        <div class="session-bar-track">
          <div class="session-bar-fill" style="width:${barWidth}%;background:${pnlColor};opacity:0.75;"></div>
        </div>
        <div class="session-bar-stats">
          <div class="session-bar-pnl" style="color:${pnlColor}">${pnlText}</div>
          <div class="session-bar-meta">${s.tradeCount} trades · ${s.winRate.toFixed(1)}% WR</div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  function destroy() {
    const container = document.getElementById('sessionContainer');
    if (container) container.innerHTML = '';
  }

  return { init, destroy };
})();
