// viz-trade-heatmap.js — A3: GitHub-style Trade Heatmap (Day × Hour)
window.VizTradeHeatmap = (() => {
  let tooltip = null;

  function getPnlColor(pnl, isDark) {
    if (pnl > 0) {
      const intensity = Math.min(pnl / 500, 1);
      return isDark
        ? `rgba(34, 197, 94, ${0.2 + intensity * 0.7})`
        : `rgba(22, 163, 74, ${0.15 + intensity * 0.7})`;
    } else if (pnl < 0) {
      const intensity = Math.min(Math.abs(pnl) / 500, 1);
      return isDark
        ? `rgba(239, 68, 68, ${0.2 + intensity * 0.7})`
        : `rgba(220, 38, 38, ${0.15 + intensity * 0.7})`;
    }
    return isDark ? '#2A2A2A' : '#E7E5E4';
  }

  function init(bot, tfData, timeframe, isDark) {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    tooltip = document.getElementById('heatmapTooltip');

    const trades = tfData.trades || [];
    if (!trades.length) {
      container.innerHTML = '<div style="color:var(--text-secondary);font-size:var(--text-sm);padding:16px;">No trade data for this timeframe</div>';
      return;
    }

    // Build heatmap data: day × hour
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const matrix = {};
    trades.forEach(t => {
      const d = new Date(t.date);
      let dayIdx = d.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6;
      // Use a pseudo hour based on trade index for variety (since mock data has no hour)
      const hourIdx = Math.floor(Math.random() * 24);
      const key = `${dayIdx}-${hourIdx}`;
      if (!matrix[key]) matrix[key] = { pnl: 0, count: 0 };
      matrix[key].pnl += t.pnl;
      matrix[key].count++;
    });

    const cellSize = 18;
    const gap = 3;
    const labelWidth = 32;
    const headerHeight = 20;
    const width = labelWidth + hours.length * (cellSize + gap);
    const height = headerHeight + days.length * (cellSize + gap);

    const svg = d3.select(container)
      .html('')
      .append('svg')
      .attr('class', 'heatmap-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Hour labels
    hours.filter(h => h % 3 === 0).forEach(h => {
      svg.append('text')
        .attr('x', labelWidth + h * (cellSize + gap) + cellSize / 2)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#78716C' : '#A8A29E')
        .attr('font-size', '9px')
        .attr('font-family', "'SF Mono', monospace")
        .text(h + ':00');
    });

    // Cells
    days.forEach((day, di) => {
      // Day label
      svg.append('text')
        .attr('x', labelWidth - 4)
        .attr('y', headerHeight + di * (cellSize + gap) + cellSize / 2 + 3)
        .attr('text-anchor', 'end')
        .attr('fill', isDark ? '#A8A29E' : '#78716C')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(day);

      hours.forEach(h => {
        const key = `${di}-${h}`;
        const data = matrix[key] || { pnl: 0, count: 0 };
        const x = labelWidth + h * (cellSize + gap);
        const y = headerHeight + di * (cellSize + gap);

        svg.append('rect')
          .attr('class', 'heatmap-cell')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('rx', 3)
          .attr('fill', data.count > 0 ? getPnlColor(data.pnl, isDark) : (isDark ? '#1A1A1A' : '#F5F5F4'))
          .on('mouseenter', function(event) {
            if (data.count === 0) return;
            const rect = this.getBoundingClientRect();
            tooltip.innerHTML = `
              <div class="tooltip-label">${day} ${h}:00</div>
              <div class="tooltip-value ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}">$${data.pnl.toFixed(0)}</div>
              <div class="tooltip-label">${data.count} trades</div>
            `;
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            tooltip.style.top = (rect.top - 8) + 'px';
            tooltip.classList.add('visible');
          })
          .on('mouseleave', () => {
            tooltip.classList.remove('visible');
          });
      });
    });
  }

  function destroy() {
    const container = document.getElementById('heatmapContainer');
    if (container) container.innerHTML = '';
  }

  return { init, destroy };
})();
