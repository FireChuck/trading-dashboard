// viz-risk-radar.js — A5: Spider/Radar Chart for Risk Profile
window.VizRiskRadar = (() => {
  let chart = null;

  function init(bot, tfData, timeframe, isDark) {
    const canvas = document.getElementById('riskRadarChart');
    if (!canvas) return;

    if (chart) chart.destroy();

    const radar = bot.riskRadar;
    if (!radar) return;

    const T = window.ThemeColors();
    const lineColor = T.accent;
    const bgColor = T.dark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)';

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
            backgroundColor: T.tipBg, titleColor: T.text, bodyColor: T.textMuted,
            borderColor: T.tipBorder, borderWidth: 1, padding: 10,
            bodyFont: { family: "'SF Mono', monospace", size: 12 },
            callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.r}/100` },
          },
        },
        scales: {
          r: {
            beginAtZero: true, max: 100,
            ticks: { stepSize: 25, color: T.textTertiary, backdropColor: 'transparent', font: { size: 9 } },
            grid: { color: T.grid },
            angleLines: { color: T.grid },
            pointLabels: { color: T.textMuted, font: { size: 10, weight: '500' } },
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
