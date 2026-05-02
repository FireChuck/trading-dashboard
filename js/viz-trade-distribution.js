/**
 * viz-trade-distribution.js — R:R Distribution Histogram
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe).rrDistribution
 */
(function() {
  'use strict';
  let _container = null;
  let _chart = null;

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    const dist = data?.rrDistribution || [];
    if (!dist.length) return;

    const T = window.ThemeColors ? window.ThemeColors() : {};
    const pc = T.dark ? 'rgba(74, 222, 128, 0.8)' : 'rgba(22, 163, 74, 0.75)';
    const lc = T.dark ? 'rgba(248, 113, 113, 0.8)' : 'rgba(220, 38, 38, 0.75)';
    const lineC = T.accent || 'var(--accent)';

    const labels = dist.map(d => d.bucket);
    const winData = dist.map(d => d.win);
    const lossData = dist.map(d => d.loss);
    const total = winData.reduce((s, v) => s + v, 0) + lossData.reduce((s, v) => s + v, 0);
    let cumPct = 0;
    const cumData = dist.map(d => { cumPct += (d.win + d.loss) / (total || 1) * 100; return Math.round(cumPct * 10) / 10; });

    container.innerHTML = '<canvas id="viz-dist-cv" style="width:100%;height:100%;"></canvas>';
    const canvas = container.querySelector('#viz-dist-cv');
    if (!canvas) return;

    if (_chart) { _chart.destroy(); _chart = null; }

    if (typeof Chart === 'undefined') {
      drawSimpleHistogram(canvas, dist, pc, lc, T);
      return;
    }

    _chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Wins', data: winData, backgroundColor: pc, borderRadius: 2, barPercentage: 0.8, categoryPercentage: 0.85, order: 2 },
          { label: 'Losses', data: lossData, backgroundColor: lc, borderRadius: 2, barPercentage: 0.8, categoryPercentage: 0.85, order: 2 },
          { label: 'Cumulative %', data: cumData, type: 'line', borderColor: lineC, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, pointBackgroundColor: lineC, tension: 0.3, yAxisID: 'y1', order: 1 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 10 }, color: T.textMuted || 'var(--text-muted)', padding: 12 } },
          tooltip: { backgroundColor: T.tipBg || 'var(--tooltip-bg)', titleColor: T.text || 'var(--text-primary)', bodyColor: T.textMuted || 'var(--text-muted)', borderColor: T.tipBorder || 'var(--border-primary)', borderWidth: 1, padding: 10, bodyFont: { family: "'SF Mono', monospace", size: 12 } },
        },
        scales: {
          x: { grid: { display: false }, stacked: true, ticks: { color: T.textMuted || 'var(--text-muted)', font: { size: 10 } } },
          y: { grid: { color: T.grid || 'var(--grid)', drawBorder: false }, stacked: true, ticks: { color: T.textMuted || 'var(--text-muted)', font: { size: 10 } } },
          y1: { position: 'right', grid: { display: false }, min: 0, max: 100, ticks: { color: T.textTertiary || 'var(--text-tertiary)', font: { size: 10 }, callback: v => v + '%' } },
        },
      },
    });
  }

  function drawSimpleHistogram(canvas, dist, pc, lc, T) {
    const dpr = devicePixelRatio || 1;
    const W = canvas.parentElement.clientWidth || 300, H = 200;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const pad = { t: 10, r: 10, b: 30, l: 30 };
    const n = dist.length;
    const maxVal = Math.max(...dist.map(d => d.win + d.loss), 1);
    const barW = (W - pad.l - pad.r) / n;

    dist.forEach((d, i) => {
      const x = pad.l + i * barW;
      const wH = (d.win / maxVal) * (H - pad.t - pad.b);
      const lH = (d.loss / maxVal) * (H - pad.t - pad.b);
      ctx.fillStyle = pc; ctx.fillRect(x + 1, H - pad.b - wH, barW / 2 - 1, wH);
      ctx.fillStyle = lc; ctx.fillRect(x + barW / 2, H - pad.b - lH, barW / 2 - 1, lH);
      ctx.fillStyle = T.textMuted || '#888'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.bucket, x + barW / 2, H - 8);
    });
  }

  function destroy() {
    if (_chart) { _chart.destroy(); _chart = null; }
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizTradeDistribution = { render, destroy };
})();
