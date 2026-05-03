// viz-pnl-by-pair.js — P&L by Pair Grouped Bar Chart (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const pairPnl = botData.pairPnl || [];
  if (!pairPnl.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:16px">No pair data</div>';
    return { destroy() {} };
  }

  const T = window.ThemeColors?.() || {};

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:300px';
  wrapper.innerHTML = '<canvas></canvas>';
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: pairPnl.map(p => p.pair),
      datasets: [
        { label: 'Win P&L', data: pairPnl.map(p => p.winPnl), backgroundColor: T.profit || '#16A34A', borderRadius: 3, barPercentage: 0.7 },
        { label: 'Loss P&L', data: pairPnl.map(p => Math.abs(p.lossPnl)), backgroundColor: T.loss || '#DC2626', borderRadius: 3, barPercentage: 0.7 },
        { label: 'Net P&L', data: pairPnl.map(p => p.totalPnl), backgroundColor: T.accent || '#5B8DEF', borderRadius: 3, barPercentage: 0.7 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      decimation: { enabled: true, threshold: 100 },
      elements: { line: { borderWidth: 1.5 } },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            font: { size: 10 },
            color: T.textMuted || '#94A3B8',
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: T.tipBg || '#1E293B',
          titleColor: T.text || '#F8FAFC',
          bodyColor: T.textMuted || '#94A3B8',
          borderColor: T.tipBorder || '#334155',
          borderWidth: 1,
          padding: 10,
          bodyFont: { family: "'SF Mono',monospace", size: 12 },
          callbacks: { label: c => `${c.dataset.label}: $${c.parsed.y.toLocaleString()}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: T.textMuted || '#94A3B8', font: { family: "'SF Mono',monospace", size: 11 } },
        },
        y: {
          grid: { color: T.grid || 'rgba(148,163,184,0.1)', drawBorder: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { family: "'SF Mono',monospace", size: 10 },
            callback: v => '$' + v.toLocaleString(),
          },
        },
      },
    },
  });

  return {
    destroy() {
      try { chart.destroy(); } catch (_) {}
      container.innerHTML = '';
    },
  };
}
