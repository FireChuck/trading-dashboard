// viz-kpi-overview.js — KPI Overview Dashboard Cards (HTML + Chart.js Mini-Sparklines)
// API: render(container, botData, options) → { destroy }

function formatPnl(v) {
  const prefix = v >= 0 ? '+' : '';
  return prefix + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatPercent(v) { return v.toFixed(1) + '%'; }

export function render(container, botData, options = {}) {
  const T = window.ThemeColors?.() || {};
  if (!botData.totalTrades) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:16px">No data</div>';
    return { destroy() {} };
  }

  const colorMap = {
    profit: T.profit || '#16A34A',
    loss: T.loss || '#DC2626',
    neutral: T.text || '#F8FAFC',
  };

  const cards = [
    { label: 'Win Rate', value: botData.winRate, format: formatPercent, color: botData.winRate >= 55 ? 'profit' : botData.winRate >= 50 ? 'neutral' : 'loss' },
    { label: 'Total P&L', value: botData.totalPnl, format: formatPnl, color: botData.totalPnl >= 0 ? 'profit' : 'loss' },
    { label: 'Sharpe Ratio', value: botData.sharpe, format: v => v.toFixed(2), color: botData.sharpe >= 2 ? 'profit' : botData.sharpe >= 1 ? 'neutral' : 'loss' },
    { label: 'Max Drawdown', value: botData.maxDrawdown, format: formatPercent, color: botData.maxDrawdown <= 5 ? 'profit' : botData.maxDrawdown <= 10 ? 'neutral' : 'loss' },
    { label: 'Profit Factor', value: botData.profitFactor, format: v => v.toFixed(2), color: botData.profitFactor >= 2 ? 'profit' : botData.profitFactor >= 1.5 ? 'neutral' : 'loss' },
    { label: 'Total Trades', value: botData.totalTrades, format: v => v.toLocaleString(), color: 'neutral' },
  ];

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:100%;height:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:4px';

  wrapper.innerHTML = cards.map((c, i) => `
    <div class="viz-kpi-card" style="background:var(--card-bg);border:1px solid var(--border-primary);border-radius:12px;padding:16px;transition:transform .15s ease,box-shadow .15s ease;cursor:default">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted,${T.textMuted || '#94A3B8'});margin-bottom:8px">${c.label}</div>
      <div style="font-size:22px;font-weight:800;color:${colorMap[c.color]};font-variant-numeric:tabular-nums;font-family:var(--mono)">${c.format(c.value)}</div>
      <div style="height:32px;margin-top:8px"><canvas class="kpi-spark" data-idx="${i}"></canvas></div>
    </div>
  `).join('');

  // Responsive overrides
  wrapper.innerHTML += `
    <style>
      .viz-kpi-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
      @media (max-width:768px) { .viz-kpi-grid, [style*="grid-template-columns:repeat(3"] { grid-template-columns:repeat(2,1fr) !important; } }
      @media (max-width:480px) { .viz-kpi-grid, [style*="grid-template-columns:repeat(2"] { grid-template-columns:1fr !important; } }
    </style>`;

  container.appendChild(wrapper);

  // Create mini sparklines for each card
  const charts = [];
  const sparkCanvases = wrapper.querySelectorAll('.kpi-spark');
  sparkCanvases.forEach(cv => {
    const idx = parseInt(cv.dataset.idx);
    const card = cards[idx];

    // Generate sparkline data from trades if available
    const trades = botData.trades || [];
    const buckets = {};
    trades.forEach(t => {
      const d = t.date instanceof Date ? t.date.toISOString().slice(0, 10) : String(t.date);
      buckets[d] = (buckets[d] || 0) + t.pnl;
    });
    const sortedDates = Object.keys(buckets).sort().slice(-10);
    const sparkData = sortedDates.map(d => buckets[d]);

    if (sparkData.length < 2) return;

    const sparkColor = colorMap[card.color];
    const ctx = cv.getContext('2d');
    const c = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sparkData.map(() => ''),
        datasets: [{
          data: sparkData,
          borderColor: sparkColor,
          backgroundColor: sparkColor + '15',
          borderWidth: 1.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        decimation: { enabled: true, threshold: 100 },
        pointRadius: 0,
        pointHoverRadius: 4,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderCapStyle: 'round', borderWidth: 1.5 } },
      },
    });
    charts.push(c);
  });

  return {
    destroy() {
      charts.forEach(c => { try { c.destroy(); } catch (_) {} });
      charts.length = 0;
      container.innerHTML = '';
    },
  };
}
