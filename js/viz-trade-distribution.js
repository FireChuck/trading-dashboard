// viz-trade-distribution.js — A6: R:R Distribution Histogram
window.VizTradeDistribution = (() => {
  let chart = null;

  function init(bot, tfData, timeframe, isDark) {
    const canvas = document.getElementById('distributionChart');
    if (!canvas) return;

    if (chart) chart.destroy();

    const dist = tfData.rrDistribution || [];
    if (!dist.length) return;

    const labels = dist.map(d => d.bucket);
    const winData = dist.map(d => d.win);
    const lossData = dist.map(d => d.loss);

    const colors = {
      win: isDark ? 'rgba(34, 197, 94, 0.8)' : 'rgba(22, 163, 74, 0.75)',
      loss: isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.75)',
      line: isDark ? '#3B82F6' : '#2563EB',
    };

    // Cumulative line
    const total = winData.reduce((s, v) => s + v, 0) + lossData.reduce((s, v) => s + v, 0);
    let cumPct = 0;
    const cumData = dist.map(d => {
      cumPct += (d.win + d.loss) / total * 100;
      return Math.round(cumPct * 10) / 10;
    });

    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Wins',
            data: winData,
            backgroundColor: colors.win,
            borderRadius: 2,
            barPercentage: 0.8,
            categoryPercentage: 0.85,
            order: 2,
          },
          {
            label: 'Losses',
            data: lossData,
            backgroundColor: colors.loss,
            borderRadius: 2,
            barPercentage: 0.8,
            categoryPercentage: 0.85,
            order: 2,
          },
          {
            label: 'Cumulative %',
            data: cumData,
            type: 'line',
            borderColor: colors.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: colors.line,
            tension: 0.3,
            yAxisID: 'y1',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'rectRounded',
              font: { size: 10 }, color: isDark ? '#A8A29E' : '#78716C', padding: 12,
            },
          },
          tooltip: {
            backgroundColor: isDark ? '#1A1A1A' : '#F5F5F4',
            titleColor: isDark ? '#F5F5F4' : '#1C1917',
            bodyColor: isDark ? '#A8A29E' : '#78716C',
            borderColor: isDark ? '#2A2A2A' : '#E7E5E4',
            borderWidth: 1,
            padding: 10,
            bodyFont: { family: "'SF Mono', monospace", size: 12 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            stacked: true,
            ticks: { color: isDark ? '#A8A29E' : '#78716C', font: { size: 10 } },
          },
          y: {
            grid: { color: isDark ? '#2A2A2A' : '#E7E5E4', drawBorder: false },
            stacked: true,
            ticks: { color: isDark ? '#A8A29E' : '#78716C', font: { size: 10 } },
          },
          y1: {
            position: 'right',
            grid: { display: false },
            min: 0, max: 100,
            ticks: { color: isDark ? '#78716C' : '#A8A29E', font: { size: 10 }, callback: v => v + '%' },
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
