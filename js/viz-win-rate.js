// viz-win-rate.js — Win Rate Doughnut Chart (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const T = window.ThemeColors?.() || {};
  const wr = botData.winRate || 0;
  const lr = 100 - wr;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:280px;display:flex;align-items:center;justify-content:center';
  wrapper.innerHTML = `
    <div style="position:relative;width:100%;max-width:320px">
      <canvas></canvas>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none">
        <div style="font-size:36px;font-weight:800;color:${T.text || '#F8FAFC'};font-family:var(--sans);line-height:1">${wr.toFixed(1)}%</div>
        <div style="font-size:11px;color:${T.textMuted || '#94A3B8'};font-family:var(--sans);margin-top:2px">Win Rate</div>
      </div>
    </div>`;
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Wins', 'Losses'],
      datasets: [{
        data: [wr, lr],
        backgroundColor: [T.profit || '#16A34A', T.loss || '#DC2626'],
        borderWidth: 0,
        borderRadius: 6,
        spacing: 3,
      }],
    },
    options: {
      responsive: true,
      cutout: '72%',
      animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: T.tipBg || '#1E293B',
          titleColor: T.text || '#F8FAFC',
          bodyColor: T.textMuted || '#94A3B8',
          cornerRadius: 8,
          padding: 10,
          borderColor: T.tipBorder || '#334155',
          bodyFont: { family: "'SF Mono',monospace", size: 12 },
          callbacks: { label: c => ` ${c.label}: ${c.parsed.toFixed(1)}%` },
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
