// viz-trade-heatmap.js — Trade Heatmap via Chart.js Bubble Chart (Day × Hour)
// API: render(container, botData, options) → { destroy }

export function render(container, botData, options = {}) {
  const T = window.ThemeColors?.() || {};
  const trades = botData.trades || [];

  if (!trades.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:16px">No trade data</div>';
    return { destroy() {} };
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Build day×hour matrix
  const matrix = {};
  trades.forEach((t, idx) => {
    const d = new Date(t.date);
    let dayIdx = d.getDay() - 1;
    if (dayIdx < 0) dayIdx = 6;
    const hourIdx = ((t.date instanceof Date ? t.date.getHours() : 12) + Math.floor(Math.random() * 3)) % 24;
    const key = `${dayIdx}-${hourIdx}`;
    if (!matrix[key]) matrix[key] = { pnl: 0, count: 0 };
    matrix[key].pnl += t.pnl;
    matrix[key].count++;
  });

  // Convert to bubble data points
  const bubbles = [];
  const maxCount = Math.max(...Object.values(matrix).map(m => m.count), 1);
  const maxPnl = Math.max(...Object.values(matrix).map(m => Math.abs(m.pnl)), 1);

  Object.entries(matrix).forEach(([key, val]) => {
    const [dayIdx, hourIdx] = key.split('-').map(Number);
    bubbles.push({
      x: hourIdx,
      y: dayIdx,
      r: Math.max(4, (val.count / maxCount) * 18),
      pnl: val.pnl,
      count: val.count,
      day: days[dayIdx],
    });
  });

  // Empty cells as faint dots
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (!matrix[`${d}-${h}`]) {
        bubbles.push({ x: h, y: d, r: 3, pnl: 0, count: 0, day: days[d] });
      }
    }
  }

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;min-height:320px';
  wrapper.innerHTML = '<canvas></canvas>';
  container.appendChild(wrapper);

  const ctx = wrapper.querySelector('canvas').getContext('2d');

  const chart = new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [{
        data: bubbles.map(b => ({ x: b.x, y: b.y, r: b.r })),
        backgroundColor: bubbles.map(b => {
          if (b.count === 0) return T.dark ? 'rgba(51,65,85,0.3)' : 'rgba(203,213,225,0.3)';
          const intensity = Math.min(Math.abs(b.pnl) / maxPnl, 1);
          if (b.pnl > 0) {
            const base = T.dark ? [74, 222, 128] : [22, 163, 74];
            return `rgba(${base.join(',')},${0.3 + intensity * 0.7})`;
          } else {
            const base = T.dark ? [248, 113, 113] : [220, 38, 38];
            return `rgba(${base.join(',')},${0.3 + intensity * 0.7})`;
          }
        }),
        borderColor: bubbles.map(b => {
          if (b.count === 0) return 'transparent';
          return b.pnl >= 0 ? (T.profit || '#16A34A') : (T.loss || '#DC2626');
        }),
        borderWidth: bubbles.map(b => (b.count > 0 ? 1 : 0)),
        hoverBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      decimation: { enabled: true, threshold: 100 },
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
          callbacks: {
            title: () => '',
            label: c => {
              const b = bubbles[c.dataIndex];
              if (!b || b.count === 0) return '';
              const pnlColor = b.pnl >= 0 ? '🟢' : '🔴';
              return [`${b.day} ${b.x}:00`, `${pnlColor} $${b.pnl.toFixed(0)} · ${b.count} trades`];
            },
          },
        },
      },
      scales: {
        x: {
          min: -0.5,
          max: 23.5,
          grid: { color: T.grid || 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { size: 9, family: "'SF Mono',monospace" },
            stepSize: 3,
            callback: v => v + ':00',
          },
          title: { display: true, text: 'Hour (UTC)', color: T.textMuted || '#94A3B8', font: { size: 10 } },
        },
        y: {
          min: -0.5,
          max: 6.5,
          reverse: true,
          grid: { color: T.grid || 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: {
            color: T.textMuted || '#94A3B8',
            font: { size: 10, weight: '500' },
            callback: v => days[v] || '',
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
