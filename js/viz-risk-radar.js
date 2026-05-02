// viz-risk-radar.js — A5: Spider/Radar Chart for Risk Profile
window.VizRiskRadar = (() => {
  let chart = null;

  function init(bot, tfData, timeframe, isDark) {
    const canvas = document.getElementById('riskRadarChart');
    if (!canvas) return;

    if (chart) chart.destroy();

    const radar = bot.riskRadar;
    if (!radar) return;

    const lineColor = isDark ? '#3B82F6' : '#2563EB';
    const bgColor = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)';

    chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: radar.labels,
        datasets: [{
          label: bot.name,
          data: radar.values,
          borderColor: lineColor,
          backgroundColor: bgColor,
          borderWidth: 2,
          pointBackgroundColor: lineColor,
          pointBorderColor: lineColor,
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            bodyFont: { family: "'SF Mono', monospace", size: 12 },
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed.r}/100`,
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 25,
              color: isDark ? '#78716C' : '#A8A29E',
              backdropColor: 'transparent',
              font: { size: 9 },
            },
            grid: { color: isDark ? '#2A2A2A' : '#E7E5E4' },
            angleLines: { color: isDark ? '#2A2A2A' : '#E7E5E4' },
            pointLabels: {
              color: isDark ? '#A8A29E' : '#78716C',
              font: { size: 10, weight: '500' },
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
