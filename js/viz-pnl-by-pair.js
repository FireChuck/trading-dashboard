// viz-pnl-by-pair.js — A4: Grouped Bar Chart (Win/Loss/Total by Pair)
window.VizPnlByPair = (() => {
  let chart = null;

  function init(bot, tfData, timeframe, isDark) {
    const canvas = document.getElementById('pnlPairChart');
    if (!canvas) return;

    if (chart) chart.destroy();

    const pairPnl = tfData.pairPnl || [];
    if (!pairPnl.length) return;

    const T = window.ThemeColors();
    const labels = pairPnl.map(p => p.pair);
    const colors = {
      win: T.profit,
      loss: T.loss,
      total: T.accent,
    };

    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Win P&L', data: pairPnl.map(p => p.winPnl), backgroundColor: colors.win, borderRadius: 3, barPercentage: 0.7 },
          { label: 'Loss P&L', data: pairPnl.map(p => Math.abs(p.lossPnl)), backgroundColor: colors.loss, borderRadius: 3, barPercentage: 0.7 },
          { label: 'Net P&L', data: pairPnl.map(p => p.totalPnl), backgroundColor: colors.total, borderRadius: 3, barPercentage: 0.7 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            display: true, position: 'top', align: 'end',
            labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 10 }, color: T.textMuted, padding: 12 },
          },
          tooltip: {
            backgroundColor: T.tipBg, titleColor: T.text, bodyColor: T.textMuted,
            borderColor: T.tipBorder, borderWidth: 1, padding: 10,
            bodyFont: { family: "'SF Mono', monospace", size: 12 },
            callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}` },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: T.textMuted, font: { family: "'SF Mono', monospace", size: 11 } } },
          y: {
            grid: { color: T.grid, drawBorder: false },
            ticks: { color: T.textMuted, font: { family: "'SF Mono', monospace", size: 10 }, callback: v => '$' + v.toLocaleString() },
          },
        },
      },
    });
  }

  function destroy() {
    if (chart) { chart.destroy(); chart = null; }
  }

  return { init, destroy };
})();
