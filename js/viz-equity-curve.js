// viz-equity-curve.js — Equity Curve with Drawdown Overlay (Chart.js)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const equityCurve = botData.equityCurve || [];
  if (!equityCurve.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:16px">No equity data</div>';
    return { destroy() {} };
  }

  const T = window.ThemeColors?.() || {};

  let peak = -Infinity;
  const drawdowns = equityCurve.map(p => {
    if (p.equity > peak) peak = p.equity;
    return { date: p.date, dd: ((peak - p.equity) / peak) * 100 };
  });

  const labels = equityCurve.map(p => {
    const d = new Date(p.date);
    return botData.timeframe === 'daily'
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : botData.timeframe === 'weekly'
        ? `W${d.getDate()}`
        : d.toLocaleDateString('en-US', { month: 'short' });
  });

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:300px';
  wrapper.innerHTML = '<canvas></canvas>';
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Equity',
          data: equityCurve.map(p => p.equity),
          borderColor: T.accent || '#5B8DEF',
          backgroundColor: T.dark ? 'rgba(96,165,250,0.08)' : 'rgba(37,99,235,0.06)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
          yAxisID: 'y',
        },
        {
          label: 'Drawdown %',
          data: drawdowns.map(d => -d.dd),
          borderColor: T.loss || '#EF4444',
          backgroundColor: T.lossFill || 'rgba(239,68,68,0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
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
          bodyFont: { family: "'SF Mono','Cascadia Code',monospace", size: 12 },
          callbacks: {
            label: c => c.datasetIndex === 0
              ? `Equity: $${c.parsed.y.toLocaleString()}`
              : `DD: ${c.parsed.y.toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: T.grid || 'rgba(148,163,184,0.1)', drawBorder: false },
          ticks: { color: T.textMuted || '#94A3B8', font: { size: 10 }, maxTicksLimit: 8 },
        },
        y: {
          position: 'left',
          grid: { color: T.grid || 'rgba(148,163,184,0.1)', drawBorder: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { family: "'SF Mono',monospace", size: 10 },
            callback: v => '$' + (v / 1000).toFixed(1) + 'k',
          },
        },
        y1: {
          position: 'right',
          grid: { display: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { family: "'SF Mono',monospace", size: 10 },
            callback: v => v.toFixed(0) + '%',
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
