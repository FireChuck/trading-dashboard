/**
 * viz-risk-radar.js — Risk Metrics Radar Chart
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe) — uses riskRadar from MOCK_DATA global or computed from trades
 */
(function() {
  'use strict';
  let _container = null;
  let _chart = null;

  function computeRiskRadar(data) {
    if (!data?.trades?.length) return null;
    const trades = data.trades;
    const pnls = trades.map(t => t.pnl);
    const mean = pnls.reduce((s, v) => s + v, 0) / pnls.length;
    const std = Math.sqrt(pnls.reduce((s, v) => s + (v - mean) ** 2, 0) / pnls.length);
    const avgTrade = Math.abs(mean);
    const volatility = Math.min(100, Math.max(10, (std / (avgTrade || 1)) * 20));
    const maxDD = Math.min(100, Math.max(10, (data.maxDrawdown || 0) * 5));

    // WR stability
    const windowSize = 20;
    const rollingWR = [];
    for (let i = windowSize; i < trades.length; i++) {
      const slice = trades.slice(i - windowSize, i);
      rollingWR.push(slice.filter(t => t.isWin || t.pnl > 0).length / windowSize);
    }
    const wrMean = rollingWR.reduce((a, b) => a + b, 0) / (rollingWR.length || 1);
    const wrStd = rollingWR.length ? Math.sqrt(rollingWR.reduce((s, v) => s + (v - wrMean) ** 2, 0) / rollingWR.length) : 0;
    const winRateStability = Math.min(95, Math.max(10, 100 - wrStd * 500));

    const avgLossSeverity = Math.min(90, Math.max(10, Math.abs(data.avgLoss || 50) / 2));
    const corrRisk = 30;
    const concentrationRisk = 40;

    return {
      labels: ['Volatility', 'Max Drawdown', 'Avg Loss', 'WR Stability', 'Correlation', 'Concentration'],
      values: [Math.round(volatility), Math.round(maxDD), Math.round(avgLossSeverity), Math.round(winRateStability), corrRisk, concentrationRisk],
    };
  }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;

    // Check if riskRadar is pre-computed (from MOCK_DATA global)
    let radar = null;
    const mockBots = window.MOCK_DATA?.bots;
    if (mockBots?.[botId]) {
      const tfData = mockBots[botId][timeframe] || mockBots[botId].daily;
      radar = tfData?.riskRadar;
    }
    if (!radar) {
      const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
      radar = computeRiskRadar(data);
    }
    if (!radar) return;

    const T = window.ThemeColors ? window.ThemeColors() : {};
    const lineColor = T.accent || 'var(--accent)';
    const bgColor = T.dark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)';

    container.innerHTML = '<canvas id="viz-risk-radar-cv" style="width:100%;height:100%;"></canvas>';
    const canvas = container.querySelector('#viz-risk-radar-cv');
    if (!canvas) return;

    if (_chart) { _chart.destroy(); _chart = null; }

    // Check for Chart.js
    if (typeof Chart === 'undefined') {
      // Fallback: draw simple radar with canvas
      drawSimpleRadar(canvas, radar, lineColor, bgColor, T);
      return;
    }

    _chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: radar.labels,
        datasets: [{
          label: botId,
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
            backgroundColor: T.tipBg || 'var(--tooltip-bg)',
            titleColor: T.text || 'var(--text-primary)',
            bodyColor: T.textMuted || 'var(--text-muted)',
            borderColor: T.tipBorder || 'var(--border-primary)',
            borderWidth: 1, padding: 10,
            bodyFont: { family: "'SF Mono', monospace", size: 12 },
            callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.r}/100` },
          },
        },
        scales: {
          r: {
            beginAtZero: true, max: 100,
            ticks: { stepSize: 25, color: T.textTertiary || 'var(--text-tertiary)', backdropColor: 'transparent', font: { size: 9 } },
            grid: { color: T.grid || 'var(--grid)' },
            angleLines: { color: T.grid || 'var(--grid)' },
            pointLabels: { color: T.textMuted || 'var(--text-muted)', font: { size: 10, weight: '500' } },
          },
        },
      },
    });
  }

  function drawSimpleRadar(canvas, radar, lineColor, bgColor, T) {
    const dpr = devicePixelRatio || 1;
    const size = Math.min(canvas.parentElement.clientWidth || 300, 300);
    canvas.width = size * dpr; canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = size * 0.38;
    const n = radar.labels.length;

    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const rr = r * ring / 4;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + rr * Math.cos(angle), y = cy + rr * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = T.grid || 'rgba(128,128,128,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // Data polygon
    ctx.beginPath();
    radar.values.forEach((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const vr = r * (v / 100);
      const x = cx + vr * Math.cos(angle), y = cy + vr * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = bgColor; ctx.fill();
    ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.stroke();

    // Points + labels
    radar.values.forEach((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const vr = r * (v / 100);
      const x = cx + vr * Math.cos(angle), y = cy + vr * Math.sin(angle);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = lineColor; ctx.fill();
      // Label
      const lx = cx + (r + 18) * Math.cos(angle), ly = cy + (r + 18) * Math.sin(angle);
      ctx.fillStyle = T.textMuted || '#888'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(radar.labels[i], lx, ly);
    });
  }

  function destroy() {
    if (_chart) { _chart.destroy(); _chart = null; }
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizRiskRadar = { render, destroy };
})();
