/**
 * viz-signal-timeline.js — Signal Timeline
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe).signals
 */
(function() {
  'use strict';
  let _container = null;
  let _themeObs = null;

  function theme() {
    const T = window.ThemeColors ? window.ThemeColors() : {};
    return {
      bg: T.bgSecondary || 'var(--bg-secondary)',
      cardBg: T.cardBg || 'var(--card-bg)',
      text: T.text || 'var(--text-primary)',
      muted: T.textMuted || 'var(--text-muted)',
      profit: T.profit || 'var(--profit)',
      loss: T.loss || 'var(--loss)',
      line: T.line || 'var(--border-primary)',
    };
  }

  function injectStyles() {
    if (document.getElementById('viz-signal-timeline-css')) return;
    const s = document.createElement('style');
    s.id = 'viz-signal-timeline-css';
    s.textContent = `
      @keyframes viz-stl-enter { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
      .viz-stl-scroll::-webkit-scrollbar { width:4px; }
      .viz-stl-scroll::-webkit-scrollbar-track { background:transparent; }
      .viz-stl-scroll::-webkit-scrollbar-thumb { background:var(--border-primary); border-radius:4px; }
    `;
    document.head.appendChild(s);
  }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;
    injectStyles();

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    const signals = data?.signals || [];
    const T = theme();

    let h = '<div style="position:relative;width:100%;height:360px;overflow:hidden">';
    h += `<div style="font-size:13px;font-weight:600;color:${T.text};margin-bottom:10px;font-family:var(--sans);display:flex;justify-content:space-between;align-items:center">`;
    h += `<span>Signal Timeline</span>`;
    h += `<span style="font-size:11px;color:${T.muted};font-weight:400">${signals.length} signals</span></div>`;
    h += `<div class="viz-stl-scroll" style="position:relative;height:calc(100% - 30px);overflow-y:auto;overflow-x:hidden;padding-right:4px">`;
    h += `<div style="position:absolute;left:52px;top:0;bottom:0;width:2px;background:${T.line};border-radius:1px"></div>`;

    signals.forEach((s, i) => {
      const win = s.pnl >= 0;
      const pc = win ? T.profit : T.loss;
      const border = win ? 'rgba(22,163,74,.2)' : 'rgba(220,38,38,.2)';

      h += `<div style="display:flex;align-items:flex-start;margin-bottom:8px;opacity:0;animation:viz-stl-enter .3s ease ${i * 50}ms forwards">`;
      h += `<div style="min-width:42px;text-align:right;padding-right:12px;padding-top:8px"><div style="font-size:10px;color:${T.muted};font-family:var(--mono)">${s.time}</div></div>`;
      h += `<div style="position:relative;z-index:1"><div style="width:12px;height:12px;border-radius:50%;background:${pc};border:2px solid ${T.cardBg};margin-top:8px;box-shadow:0 0 0 2px ${pc}40"></div></div>`;
      h += `<div style="flex:1;margin-left:12px;background:${T.cardBg};border:1px solid ${border};border-radius:10px;padding:10px 14px;min-width:0;box-shadow:var(--shadow-sm)">`;
      h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">`;
      h += `<span style="font-size:11px;font-weight:600;color:${pc};font-family:var(--sans);text-transform:uppercase;letter-spacing:.5px">${s.direction}</span>`;
      h += `<span style="font-size:12px;font-weight:700;color:${pc};font-family:var(--mono)">${win ? '+' : ''}$${s.pnl.toLocaleString()}</span></div>`;
      h += `<div style="display:flex;gap:8px;flex-wrap:wrap">`;
      h += `<span style="font-size:11px;color:${T.text};font-family:var(--mono);font-weight:500">${s.pair}</span>`;
      h += `<span style="font-size:10px;color:${T.muted};font-family:var(--sans)">@ ${s.entry.toLocaleString()}</span>`;
      h += `<span style="font-size:10px;color:${T.muted};font-family:var(--sans);background:${T.bg};padding:1px 6px;border-radius:4px">${s.session}</span>`;
      h += `</div></div></div>`;
    });

    h += '</div></div>';
    container.innerHTML = h;

    const scrollEl = container.querySelector('.viz-stl-scroll');
    if (scrollEl) {
      setTimeout(() => { scrollEl.scrollTop = scrollEl.scrollHeight; }, signals.length * 50 + 100);
    }
  }

  function destroy() {
    if (_themeObs) { _themeObs.disconnect(); _themeObs = null; }
    if (_container) { _container.innerHTML = ''; }
    _container = null;
  }

  window.VizSignalTimeline = { render, destroy };
})();
