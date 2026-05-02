/**
 * viz-avg-trade-pnl.js — B15: Avg Trade P&L Candlestick-Style Bars (Custom SVG)
 * Horizontal bars: body = avg win (green) / avg loss (red), wick = max/min trade
 */
window.VizAvgTradePnl = (() => {
  'use strict';

  let _container = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function getTheme() {
    const T = window.ThemeColors();
    return { bg: T.bg, text: T.text, textMuted: T.textMuted, profit: T.profit, loss: T.loss, profitFill: T.profitFill, lossFill: T.lossFill, gridLine: T.gridLine };
  }

  function render(container, botId, timeframe) {
    if (_rendering) return;
    _rendering = true;
    try {
    const data = window.getMockData(botId, timeframe);
    if (!data || !container) return;

    cleanup();

    _container = container;
    _lastBotId = botId;
    _lastTimeframe = timeframe;

    const theme = getTheme();
    const W = container.clientWidth || 400;
    const H = Math.max(W * 0.6, 200);
    const margin = { top: 30, right: 20, bottom: 10, left: 110 };
    const chartW = W - margin.left - margin.right;
    const chartH = H - margin.top - margin.bottom;

    const botName = botId === 'alphaTrader' ? 'AlphaTrader Pro' : botId === 'trendRider' ? 'TrendRider AI' : botId === 'scalpMaster' ? 'ScalpMaster X' : botId;

    const bestPnl = data.bestTrade ? (data.bestTrade.pnl || 0) : 0;
    const worstPnl = data.worstTrade ? (data.worstTrade.pnl || 0) : 0;
    const row = {
      name: botName,
      avgWin: data.avgWin || 0,
      avgLoss: Math.abs(data.avgLoss || 0),
      maxTrade: Math.max(bestPnl, Math.abs(worstPnl)),
      minTrade: Math.min(bestPnl, worstPnl)
    };

    const allValues = [row.avgWin, -row.avgLoss, row.maxTrade, row.minTrade];
    const absMax = Math.max(Math.abs(Math.min(...allValues)), Math.abs(Math.max(...allValues)), 1);
    const scale = chartW / (absMax * 2.2);
    const centerX = margin.left + chartW / 2;
    const barH = Math.min(chartH * 0.65, 32);
    const gap = (chartH - barH) / 2;
    const y = margin.top + gap;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

    svg += `<text x="${W / 2}" y="18" text-anchor="middle" fill="${theme.text}" font-size="12" font-weight="600" font-family="var(--sans)">Avg Trade P&L</text>`;

    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${W - margin.right}" y2="${margin.top}" stroke="${theme.gridLine}" stroke-width="1" stroke-dasharray="4,4"/>`;
    svg += `<text x="${centerX}" y="${margin.top - 4}" text-anchor="middle" fill="${theme.textMuted}" font-size="9" font-family="var(--mono)">$0</text>`;

    svg += `<text x="${margin.left - 8}" y="${y + barH / 2 + 4}" text-anchor="end" fill="${theme.text}" font-size="11" font-weight="500" font-family="var(--sans)">${row.name}</text>`;

    const maxWickX = centerX + row.maxTrade * scale;
    svg += `<line x1="${maxWickX}" y1="${y + barH * 0.3}" x2="${maxWickX}" y2="${y + barH * 0.7}" stroke="${theme.profit}" stroke-width="1.5" opacity="0.5" class="pnl-wick" data-bot="${row.name}" data-type="max" data-val="${row.maxTrade}"/>`;

    const winX = centerX;
    const winW = row.avgWin * scale;
    svg += `<rect class="pnl-body" data-bot="${row.name}" data-type="avgWin" data-val="${row.avgWin}" x="${winX}" y="${y + barH * 0.2}" width="${winW}" height="${barH * 0.6}" fill="${theme.profitFill}" rx="3" opacity="0.8" style="cursor:pointer;transition:opacity 150ms ease"/>`;

    const lossW = row.avgLoss * scale;
    svg += `<rect class="pnl-body" data-bot="${row.name}" data-type="avgLoss" data-val="${row.avgLoss}" x="${centerX - lossW}" y="${y + barH * 0.2}" width="${lossW}" height="${barH * 0.6}" fill="${theme.lossFill}" rx="3" opacity="0.8" style="cursor:pointer;transition:opacity 150ms ease"/>`;

    const minWickX = centerX + row.minTrade * scale;
    svg += `<line x1="${minWickX}" y1="${y + barH * 0.3}" x2="${minWickX}" y2="${y + barH * 0.7}" stroke="${theme.loss}" stroke-width="1.5" opacity="0.5" class="pnl-wick" data-bot="${row.name}" data-type="min" data-val="${row.minTrade}"/>`;

    svg += `<line x1="${minWickX}" y1="${y + barH / 2}" x2="${maxWickX}" y2="${y + barH / 2}" stroke="${theme.gridLine}" stroke-width="0.5"/>`;

    if (winW > 40) {
      svg += `<text x="${winX + winW / 2}" y="${y + barH / 2 + 4}" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="700" font-family="var(--mono)">+$${row.avgWin}</text>`;
    }
    if (lossW > 40) {
      svg += `<text x="${centerX - lossW / 2}" y="${y + barH / 2 + 4}" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="700" font-family="var(--mono)">-$${row.avgLoss}</text>`;
    }

    const tickCount = 5;
    for (let i = -tickCount; i <= tickCount; i++) {
      const val = (i / tickCount) * absMax;
      const x = centerX + val * scale;
      if (Math.abs(i) > 0) {
        svg += `<text x="${x}" y="${H - 2}" text-anchor="middle" fill="${theme.textMuted}" font-size="8" font-family="var(--mono)">$${Math.abs(val).toFixed(0)}</text>`;
      }
    }

    svg += `</svg>`;

    let html = `<div style="position:relative;">${svg}`;
    html += `<div class="pnl-tooltip" style="display:none;position:absolute;padding:8px 12px;background:${theme.bg};border:1px solid ${theme.gridLine};border-radius:8px;font-size:11px;font-family:var(--sans);box-shadow:var(--shadow-md);pointer-events:none;z-index:10;">
      <div class="pnl-tooltip-text"></div>
    </div></div>`;

    container.innerHTML = html;

    const tooltip = container.querySelector('.pnl-tooltip');
    const tooltipText = container.querySelector('.pnl-tooltip-text');

    container.querySelectorAll('.pnl-body, .pnl-wick').forEach(el => {
      el.addEventListener('mouseenter', function() {
        const bot = this.dataset.bot;
        const type = this.dataset.type;
        const val = parseFloat(this.dataset.val);
        const typeLabel = type === 'avgWin' ? 'Avg Win' : type === 'avgLoss' ? 'Avg Loss' : type === 'max' ? 'Max Trade' : 'Min Trade';
        const color = val >= 0 ? theme.profit : theme.loss;
        tooltipText.innerHTML = `<span style="font-weight:600;color:${theme.text};">${bot}</span><br><span style="color:${color};">${typeLabel}: ${val >= 0 ? '+' : '-'}$${Math.abs(val).toLocaleString()}</span>`;
        tooltip.style.display = 'block';
        this.style.opacity = '0.5';
      });
      el.addEventListener('mousemove', function(e) {
        const rect = container.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 45) + 'px';
      });
      el.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
        this.style.opacity = this.classList.contains('pnl-wick') ? '0.5' : '0.8';
      });
    });

    setupObservers(botId, timeframe);
    } finally { _rendering = false; }
  }

  function cleanup() {
    _rendering = false;
    if (_ro) { _ro.disconnect(); _ro = null; }
    if (_themeObs) { _themeObs.disconnect(); _themeObs = null; }
    if (_container) { _container.innerHTML = ''; }
    _container = null;
  }

  function setupObservers(botId, timeframe) {
    if (!_container) return;
    _ro = new ResizeObserver(() => render(_container, botId, timeframe));
    _ro.observe(_container);
    _themeObs = new MutationObserver(() => render(_container, botId, timeframe));
    _themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function update(botId, timeframe) {
    _lastBotId = botId;
    _lastTimeframe = timeframe;
    render(_container, botId, timeframe);
  }

  return { render, update, destroy: cleanup };
})();
