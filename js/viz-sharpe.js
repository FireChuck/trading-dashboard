// viz-sharpe.js — Sharpe Ratio Scorecard with Sparkline (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const T = window.ThemeColors?.() || {};
  const sh = botData.sharpe || 0;
  const trend = botData.sharpeTrend || [sh];

  const barColor = sh >= 2 ? (T.profit || '#16A34A') : sh >= 1 ? (T.yellow || '#F59E0B') : (T.loss || '#DC2626');
  const rating = sh >= 2 ? 'Excellent' : sh >= 1.5 ? 'Good' : sh >= 1 ? 'Moderate' : 'Poor';
  const td = trend.length >= 2 ? trend[trend.length - 1] - trend[trend.length - 2] : 0;
  const trendIcon = td > 0.05 ? '↑ Rising' : td < -0.05 ? '↓ Falling' : '→ Stable';
  const trendColor = td > 0.05 ? (T.profit || '#16A34A') : td < -0.05 ? (T.loss || '#DC2626') : (T.textMuted || '#94A3B8');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px';
  wrapper.innerHTML = `
    <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${barColor};background:${barColor}15;padding:3px 10px;border-radius:20px;font-family:var(--sans)">${rating}</span>
    <div style="display:flex;align-items:baseline;gap:6px">
      <span style="font-size:48px;font-weight:900;color:${barColor};font-family:var(--sans);line-height:1">${sh.toFixed(2)}</span>
      <span style="font-size:13px;color:${trendColor};font-family:var(--sans);font-weight:500">${trendIcon}</span>
    </div>
    <div style="font-size:11px;color:${T.textMuted || '#94A3B8'};font-family:var(--sans)">Sharpe Ratio</div>
    <div style="width:100%;max-width:260px;height:50px"><canvas></canvas></div>
    <div style="display:flex;justify-content:space-between;width:100%;max-width:260px;font-size:9px;color:${T.textMuted || '#94A3B8'};font-family:var(--mono)">
      <span>T-6</span><span>Now</span>
    </div>`;
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trend.map((_, i) => `T-${trend.length - 1 - i}`),
      datasets: [{
        data: trend,
        borderColor: barColor,
        backgroundColor: barColor + '15',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
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
          bodyFont: { family: "'SF Mono',monospace", size: 12 },
          callbacks: { label: c => ` Sharpe: ${c.parsed.y.toFixed(2)}` },
        },
      },
      scales: {
        x: { display: false },
        y: { display: false },
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
