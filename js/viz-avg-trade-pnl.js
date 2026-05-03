// viz-avg-trade-pnl.js — Avg Trade P&L Horizontal Bar Chart (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const T = window.ThemeColors?.() || {};

  const avgWin = botData.avgWin || 0;
  const avgLoss = Math.abs(botData.avgLoss || 0);
  const bestPnl = botData.bestTrade?.pnl || 0;
  const worstPnl = botData.worstTrade?.pnl || 0;
  const maxTrade = Math.max(bestPnl, Math.abs(worstPnl));
  const minTrade = Math.min(bestPnl, worstPnl);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:250px';
  wrapper.innerHTML = '<canvas></canvas>';
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Max Win', 'Avg Win', 'Avg Loss', 'Max Loss'],
      datasets: [{
        data: [bestPnl, avgWin, -avgLoss, worstPnl],
        backgroundColor: [bestPnl, avgWin, -avgLoss, worstPnl].map(v =>
          v >= 0 ? (T.profit || '#16A34A') : (T.loss || '#DC2626')
        ),
        borderRadius: 4,
        barPercentage: 0.6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: T.tipBg || '#1E293B',
          titleColor: T.text || '#F8FAFC',
          bodyColor: T.textMuted || '#94A3B8',
          borderColor: T.tipBorder || '#334155',
          borderWidth: 1,
          padding: 10,
          bodyFont: { family: "'SF Mono',monospace", size: 12 },
          callbacks: {
            label: c => {
              const v = c.parsed.x;
              return `${v >= 0 ? '+' : ''}$${v.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: T.grid || 'rgba(148,163,184,0.1)', drawBorder: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { family: "'SF Mono',monospace", size: 10 },
            callback: v => (v >= 0 ? '+' : '') + '$' + v.toLocaleString(),
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: T.text || '#F8FAFC',
            font: { size: 12, weight: '500' },
          },
        },
      },
    },
  });

  const ro = new ResizeObserver(() => chart.resize());
  ro.observe(container);

  return {
    destroy() {
      ro.disconnect();
      chart.destroy();
      container.innerHTML = '';
    },
  };
}
