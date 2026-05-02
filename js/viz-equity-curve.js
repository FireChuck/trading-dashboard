// viz-equity-curve.js — A2: Equity Curve with Drawdown Overlay
window.VizEquityCurve = (() => {
  let chart = null;

  function getChartColors(isDark) {
    const cs = getComputedStyle(document.documentElement);
    return {
      line: isDark ? '#3B82F6' : '#2563EB',
      lineBg: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.06)',
      ddLine: isDark ? '#EF4444' : '#DC2626',
      ddBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.06)',
      grid: cs.getPropertyValue('--chart-grid').trim(),
      text: cs.getPropertyValue('--chart-text').trim(),
    };
  }

  function init(bot, tfData, timeframe, isDark) {
    const canvas = document.getElementById('equityChart');
    if (!canvas) return;

    if (chart) chart.destroy();

    const equityCurve = tfData.equityCurve || [];
    if (!equityCurve.length) return;

    // Compute drawdown series
    let peak = -Infinity;
    const drawdowns = equityCurve.map(p => {
      if (p.equity > peak) peak = p.equity;
      const dd = ((peak - p.equity) / peak) * 100;
      return { date: p.date, dd };
    });

    const labels = equityCurve.map(p => {
      const d = new Date(p.date);
      return timeframe === 'daily' ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : timeframe === 'weekly' ? `W${d.getDate()}`
        : d.toLocaleDateString('en-US', { month: 'short' });
    });

    const colors = getChartColors(isDark);

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Equity',
            data: equityCurve.map(p => p.equity),
            borderColor: colors.line,
            backgroundColor: colors.lineBg,
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
            borderColor: colors.ddLine,
            backgroundColor: colors.ddBg,
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
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F4',
            titleColor: isDark ? '#F5F5F4' : '#1C1917',
            bodyColor: isDark ? '#A8A29E' : '#78716C',
            borderColor: isDark ? '#2A2A2A' : '#E7E5E4',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            boxPadding: 4,
            bodyFont: { family: "'SF Mono', 'Cascadia Code', monospace", size: 12 },
            callbacks: {
              label: ctx => {
                if (ctx.datasetIndex === 0) return `Equity: $${ctx.parsed.y.toLocaleString()}`;
                return `DD: ${ctx.parsed.y.toFixed(1)}%`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: colors.grid, drawBorder: false },
            ticks: { color: colors.text, font: { size: 10 }, maxTicksLimit: 8 },
          },
          y: {
            position: 'left',
            grid: { color: colors.grid, drawBorder: false },
            ticks: {
              color: colors.text,
              font: { family: "'SF Mono', monospace", size: 10 },
              callback: v => '$' + (v / 1000).toFixed(1) + 'k',
            },
          },
          y1: {
            position: 'right',
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { family: "'SF Mono', monospace", size: 10 },
              callback: v => v.toFixed(0) + '%',
            },
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
