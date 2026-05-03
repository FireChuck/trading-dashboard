// viz-profit-factor.js — Profit Factor Bar Gauge (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const T = window.ThemeColors?.() || {};
  const pf = Math.min(botData.profitFactor || 0, 3.5);

  // Color zones
  const barColor = pf < 1 ? (T.loss || '#DC2626') : pf < 1.5 ? (T.yellow || '#F59E0B') : (T.profit || '#16A34A');

  // Background zones (0-1 red, 1-1.5 yellow, 1.5-3 green)
  const zoneColors = [
    { from: 0, to: 1, color: T.dark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.15)' },
    { from: 1, to: 1.5, color: T.dark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)' },
    { from: 1.5, to: 3, color: T.dark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.15)' },
  ];

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px';
  wrapper.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${T.textMuted || '#94A3B8'};margin-bottom:8px">Profit Factor</div>
      <div style="font-size:42px;font-weight:900;color:${barColor};font-family:var(--sans);line-height:1">${pf.toFixed(2)}</div>
      <div style="font-size:11px;color:${T.textMuted || '#94A3B8'};margin-top:4px;font-family:var(--sans)">
        ${pf < 1 ? '🔴 Unprofitable' : pf < 1.5 ? '🟡 Marginal' : '🟢 Healthy'}
      </div>
    </div>
    <div style="width:100%;max-width:300px;height:40px"><canvas></canvas></div>
    <div style="display:flex;justify-content:space-between;width:100%;max-width:300px;font-size:9px;color:${T.textMuted || '#94A3B8'};font-family:var(--mono)">
      <span>0</span><span>1.0</span><span>1.5</span><span>2.0</span><span>3.0</span>
    </div>`;
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [''],
      datasets: [
        ...zoneColors.map(z => ({
          label: 'Zone',
          data: [z.to - z.from],
          backgroundColor: z.color,
          barPercentage: 1,
          categoryPercentage: 1,
          stack: 'zones',
        })),
        {
          label: 'PF',
          data: [Math.min(pf, 3)],
          backgroundColor: barColor,
          barPercentage: 1,
          categoryPercentage: 1,
          stack: 'value',
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      decimation: { enabled: true, threshold: 100 },
      elements: { line: { borderWidth: 1.5 } },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          stacked: true,
          min: 0,
          max: 3,
          grid: { display: false },
          ticks: { display: false },
          border: { display: false },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { display: false },
          border: { display: false },
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
