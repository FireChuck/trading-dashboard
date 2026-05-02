/**
 * viz-kpi-overview.js — KPI Overview Dashboard Cards
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe) — flat KPI fields
 */
(function() {
  'use strict';
  let _container = null;
  let _animFrame = null;

  function formatPnl(v) {
    const prefix = v >= 0 ? '+' : '';
    return prefix + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatPercent(v) { return v.toFixed(1) + '%'; }

  function trendIcon(v, invert) {
    const positive = invert ? v < 0 : v > 0;
    if (Math.abs(v) < 0.01) return '<span style="color:var(--text-muted)">—</span>';
    return positive
      ? `<span style="color:var(--profit);font-size:11px;">↑ ${Math.abs(v).toFixed(1)}%</span>`
      : `<span style="color:var(--loss);font-size:11px;">↓ ${Math.abs(v).toFixed(1)}%</span>`;
  }

  function injectStyles() {
    if (document.getElementById('viz-kpi-css')) return;
    const s = document.createElement('style');
    s.id = 'viz-kpi-css';
    s.textContent = `
      .viz-kpi-card { background:var(--card-bg); border:1px solid var(--border-primary); border-radius:12px; padding:16px; transition:transform .15s ease,box-shadow .15s ease; }
      .viz-kpi-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
      @media (max-width:768px) { .viz-kpi-grid { grid-template-columns:repeat(2,1fr) !important; } }
      @media (max-width:480px) { .viz-kpi-grid { grid-template-columns:1fr !important; } }
    `;
    document.head.appendChild(s);
  }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;
    if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    injectStyles();

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    if (!data || !data.totalTrades) return;

    const cards = [
      { label: 'Win Rate', value: data.winRate, format: formatPercent, color: data.winRate >= 55 ? 'profit' : data.winRate >= 50 ? 'neutral' : 'loss' },
      { label: 'Total P&L', value: data.totalPnl, format: formatPnl, color: data.totalPnl >= 0 ? 'profit' : 'loss' },
      { label: 'Sharpe Ratio', value: data.sharpe, format: v => v.toFixed(2), color: data.sharpe >= 2 ? 'profit' : data.sharpe >= 1 ? 'neutral' : 'loss' },
      { label: 'Max Drawdown', value: data.maxDrawdown, format: formatPercent, color: data.maxDrawdown <= 5 ? 'profit' : data.maxDrawdown <= 10 ? 'neutral' : 'loss' },
      { label: 'Profit Factor', value: data.profitFactor, format: v => v.toFixed(2), color: data.profitFactor >= 2 ? 'profit' : data.profitFactor >= 1.5 ? 'neutral' : 'loss' },
      { label: 'Total Trades', value: data.totalTrades, format: v => v.toLocaleString(), color: 'neutral' },
    ];

    const colorMap = { profit: 'var(--profit)', loss: 'var(--loss)', neutral: 'var(--text-primary)' };

    container.innerHTML = `<div class="viz-kpi-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">${cards.map(c => `
      <div class="viz-kpi-card">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px;">${c.label}</div>
        <div style="font-size:22px;font-weight:800;color:${colorMap[c.color]};font-variant-numeric:tabular-nums;font-family:var(--mono);">${c.format(c.value)}</div>
      </div>
    `).join('')}</div>`;
  }

  function destroy() {
    if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizKpiOverview = { render, destroy };
})();
