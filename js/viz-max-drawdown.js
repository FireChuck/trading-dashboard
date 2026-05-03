// viz-max-drawdown.js — Max Drawdown Area Chart (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const curve = botData.drawdownCurve || [];
  if (!curve.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:16px">No drawdown data</div>';
    return { destroy() {} };
  }

  const T = window.ThemeColors?.() || {};
  const maxDD = Math.max(...curve.map(d => d.dd), 0);
  const maxIdx = curve.findIndex(d => d.dd === maxDD);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:300px';
  wrapper.innerHTML = '<canvas></canvas>';
  container.appendChild(wrapper);

  const canvas = wrapper.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, T.lossFill || 'rgba(239,68,68,0.15)');
  grad.addColorStop(1, T.lossFill || 'rgba(239,68,68,0.3)');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: curve.map(d => d.date.slice(5)),
      datasets: [{
        label: 'Drawdown',
        data: curve.map(d => -d.dd),
        borderColor: T.loss || '#EF4444',
        borderWidth: 2.5,
        backgroundColor: grad,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointBackgroundColor: curve.map(() => 'transparent'),
        pointBorderColor: T.loss || '#EF4444',
        pointBorderWidth: 2,
        pointHoverRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      decimation: { enabled: true, threshold: 100 },
      pointRadius: 0,
      pointHoverRadius: 4,
      elements: { line: { borderWidth: 1.5 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: T.tipBg || '#1E293B',
          titleColor: T.text || '#F8FAFC',
          bodyColor: T.textMuted || '#94A3B8',
          borderColor: T.tipBorder || '#334155',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          bodyFont: { family: "'SF Mono',monospace", size: 12 },
          callbacks: {
            title: i => i[0].label,
            label: c => ` Drawdown: -$${Math.abs(c.parsed.y).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: T.grid || 'rgba(148,163,184,0.1)', drawBorder: false },
          ticks: { color: T.textMuted || '#94A3B8', font: { size: 10, family: "'SF Mono',monospace" }, maxRotation: 0 },
          border: { display: false },
        },
        y: {
          grid: { color: T.grid || 'rgba(148,163,184,0.1)', drawBorder: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { size: 10, family: "'SF Mono',monospace" },
            callback: v => '-$' + Math.abs(v).toLocaleString(),
          },
          border: { display: false },
        },
      },
      interaction: { intersect: false, mode: 'index' },
    },
  });

  return {
    destroy() {
      try { chart.destroy(); } catch (_) {}
      container.innerHTML = '';
    },
  };
}
