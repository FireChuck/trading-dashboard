/**
 * viz-profit-factor-gauge.js — B12: Profit Factor Gauge (Custom SVG)
 * Half-circle speedometer 0-3.0+. Zones: Red(<1), Yellow(1-1.5), Green(>1.5).
 * Animated needle sweep.
 */
window.VizProfitFactorGauge = (() => {
  'use strict';

  let _container = null;
  let _ro = null;
  let _rendering = false;
  let _themeObs = null;
  let _af = null;
  let _lastBotId = null;
  let _lastTimeframe = null;

  function theme() {
    const T = window.ThemeColors();
    return { bg: T.bg, text: T.text, muted: T.textMuted, red: T.red, yellow: T.yellow, green: T.green, track: T.gridLine };
  }

  function p2c(cx, cy, r, a) {
    const rad = (a - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arc(cx, cy, r, s, e) {
    const sp = p2c(cx, cy, r, s), ep = p2c(cx, cy, r, e), l = (e - s) > 180 ? 1 : 0;
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${l} 1 ${ep.x} ${ep.y}`;
  }

  function pfAngle(v) { return 180 - Math.max(0, Math.min(3, v)) / 3 * 180; }

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

    const T = theme();
    const pf = Math.min(data.profitFactor || 0, 3.5);
    const W = container.clientWidth || 300;
    const H = Math.max(W * 0.65, 180);
    const cx = W / 2;
    const cy = H * 0.78;
    const r = Math.min(W / 2 - 20, H * 0.6);

    const zRed = pfAngle(1);
    const zYellow = pfAngle(1.5);
    const tAngle = pfAngle(pf);
    const ac = pf < 1 ? T.red : pf < 1.5 ? T.yellow : T.green;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    svg += `<path d="${arc(cx, cy, r, 180, 0)}" fill="none" stroke="${T.track}" stroke-width="18" stroke-linecap="round"/>`;
    svg += `<path d="${arc(cx, cy, r, 180, zRed)}" fill="none" stroke="${T.red}" stroke-width="18" stroke-linecap="round" opacity=".3"/>`;
    svg += `<path d="${arc(cx, cy, r, zRed, zYellow)}" fill="none" stroke="${T.yellow}" stroke-width="18" opacity=".3"/>`;
    svg += `<path d="${arc(cx, cy, r, zYellow, 0)}" fill="none" stroke="${T.green}" stroke-width="18" stroke-linecap="round" opacity=".3"/>`;
    svg += `<path id="ga" d="${arc(cx, cy, r, 180, 180)}" fill="none" stroke="${ac}" stroke-width="18" stroke-linecap="round"/>`;
    const nr = r - 15;
    svg += `<line id="gn" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - nr}" stroke="${T.text}" stroke-width="2.5" stroke-linecap="round" transform="rotate(180,${cx},${cy})"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="6" fill="${T.text}"/><circle cx="${cx}" cy="${cy}" r="3" fill="${T.bg}"/>`;
    svg += `<text x="${cx}" y="${cy + 28}" text-anchor="middle" fill="${ac}" font-size="22" font-weight="800" font-family="var(--sans)" id="gv">0.00</text>`;
    svg += `<text x="${cx}" y="${cy + 44}" text-anchor="middle" fill="${T.muted}" font-size="10" font-family="var(--sans)">Profit Factor</text>`;
    [{ v: 0, a: 180 }, { v: .5, a: 150 }, { v: 1, a: 120 }, { v: 1.5, a: 90 }, { v: 2, a: 60 }, { v: 2.5, a: 30 }, { v: 3, a: 0 }].forEach(l => {
      const p = p2c(cx, cy, r + 16, l.a);
      svg += `<text x="${p.x}" y="${p.y + 4}" text-anchor="middle" fill="${T.muted}" font-size="9" font-family="var(--mono)">${l.v}</text>`;
    });
    const rl = p2c(cx, cy, r - 30, 150), yl = p2c(cx, cy, r - 30, 105), gl = p2c(cx, cy, r - 30, 45);
    svg += `<text x="${rl.x}" y="${rl.y}" text-anchor="middle" fill="${T.red}" font-size="8" font-weight="600" font-family="var(--sans)" opacity=".7">RISK</text>`;
    svg += `<text x="${yl.x}" y="${yl.y}" text-anchor="middle" fill="${T.yellow}" font-size="8" font-weight="600" font-family="var(--sans)" opacity=".7">CAUTION</text>`;
    svg += `<text x="${gl.x}" y="${gl.y}" text-anchor="middle" fill="${T.green}" font-size="8" font-weight="600" font-family="var(--sans)" opacity=".7">HEALTHY</text>`;
    svg += `</svg>`;
    container.innerHTML = svg;

    const a = container.querySelector('#ga');
    const n = container.querySelector('#gn');
    const v = container.querySelector('#gv');
    const st = performance.now();

    function anim(now) {
      const t = Math.min((now - st) / 900, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const ca = 180 - e * (180 - tAngle);
      const cp = e * pf;
      a.setAttribute('d', arc(cx, cy, r, 180, ca));
      n.setAttribute('transform', `rotate(${ca},${cx},${cy})`);
      v.textContent = cp.toFixed(2);
      if (t < 1) _af = requestAnimationFrame(anim);
    }
    _af = requestAnimationFrame(anim);

    setupObservers(botId, timeframe);
    } finally { _rendering = false; }
  }

  function cleanup() {
    _rendering = false;
    if (_af) cancelAnimationFrame(_af);
    _af = null;
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
