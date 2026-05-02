/**
 * viz-correlation-matrix.js — Inter-Bot Correlation Heatmap
 * Unified API: render(container, botId, timeframe)
 * Data source: getMockData(botId, timeframe).correlation
 */
(function() {
  'use strict';
  let _container = null;

  function theme() {
    const T = window.ThemeColors ? window.ThemeColors() : {};
    return {
      bg: T.bg || 'var(--bg-primary)',
      text: T.text || 'var(--text-primary)',
      muted: T.textMuted || 'var(--text-muted)',
      border: T.border || 'var(--border-primary)',
      tipBg: T.tipBg || 'var(--tooltip-bg)',
      tipBorder: T.tipBorder || 'var(--border-primary)',
    };
  }

  function cColor(v) {
    if (v >= 0) { const t = Math.min(v, 1); return `rgb(255,${Math.round(255 * (1 - t))},${Math.round(255 * (1 - t))})`; }
    const t = Math.min(-v, 1); return `rgb(${Math.round(255 * (1 - t))},${Math.round(255 * (1 - t))},255)`;
  }

  function tColor(v) { return Math.abs(v) > 0.55 ? '#FFF' : '#1C1917'; }

  function render(container, botId, timeframe) {
    if (!container) return;
    _container = container;
    const T = theme();

    const data = typeof getMockData === 'function' ? getMockData(botId, timeframe) : null;
    const correlation = data?.correlation || {};
    if (!Object.keys(correlation).length) return;

    // All bot IDs from correlation keys
    const botIds = Object.keys(correlation);
    const labels = botIds.map(id => id.replace(/([A-Z])/g, ' $1').trim().replace(/^./, s => s.toUpperCase()));
    const shortLabels = labels.map(l => l.length > 10 ? l.split(' ').map(w => w.slice(0, 5)).join('\n') : l);

    const W = container.clientWidth || 400, H = Math.max(W * 0.85, 280);
    const m = { t: 40, r: 20, b: 20, l: 90 };
    const sz = Math.min((W - m.l - m.r) / botIds.length, (H - m.t - m.b) / botIds.length);

    let h = `<div style="position:relative;width:100%;height:${H}px"><svg width="100%" height="100%" viewBox="0 0 ${W} ${H}">`;
    h += `<text x="${W / 2}" y="24" text-anchor="middle" fill="${T.text}" font-size="13" font-weight="600" font-family="var(--sans)">Bot Correlation Matrix</text>`;

    // Legend
    for (let i = 0; i <= 20; i++) { const v = -1 + (i / 20) * 2, x = W - 130 + i * 6; h += `<rect x="${x}" y="8" width="6" height="10" fill="${cColor(v)}" rx="1"/>`; }
    h += `<text x="${W - 130}" y="28" fill="${T.muted}" font-size="9" font-family="var(--sans)">-1</text>`;
    h += `<text x="${W - 70}" y="28" fill="${T.muted}" font-size="9" text-anchor="middle" font-family="var(--sans)">0</text>`;
    h += `<text x="${W - 10}" y="28" fill="${T.muted}" font-size="9" text-anchor="end" font-family="var(--sans)">+1</text>`;

    botIds.forEach((bid, i) => {
      shortLabels[i].split('\n').forEach((ln, li) => {
        h += `<text x="${m.l - 8}" y="${m.t + i * sz + sz / 2 + (li - 0.5) * 13}" text-anchor="end" fill="${T.text}" font-size="11" font-family="var(--sans)" dominant-baseline="middle">${ln}</text>`;
      });
      botIds.forEach((cid, j) => {
        const val = bid === cid ? 1 : (correlation[cid] ?? 0);
        const x = m.l + j * sz, y = m.t + i * sz;
        h += `<rect class="viz-cm-cell" data-r="${bid}" data-c="${cid}" data-v="${val}" x="${x}" y="${y}" width="${sz - 2}" height="${sz - 2}" fill="${cColor(val)}" rx="4" stroke="${T.border}" stroke-width=".5" style="cursor:pointer;transition:opacity .15s"/>`;
        h += `<text x="${x + sz / 2}" y="${y + sz / 2}" text-anchor="middle" dominant-baseline="middle" fill="${tColor(val)}" font-size="14" font-weight="700" font-family="var(--mono)">${val.toFixed(2)}</text>`;
      });
    });

    // Bottom labels
    botIds.forEach((bid, j) => {
      shortLabels[j].split('\n').forEach((ln, li) => {
        h += `<text x="${m.l + j * sz + sz / 2}" y="${m.t + botIds.length * sz + 12 + li * 13}" text-anchor="middle" fill="${T.muted}" font-size="10" font-family="var(--sans)">${ln}</text>`;
      });
    });

    h += `</svg><div class="viz-cm-tip" style="display:none;position:absolute;padding:8px 12px;background:${T.tipBg};border:1px solid ${T.tipBorder};border-radius:8px;font-size:12px;font-family:var(--sans);box-shadow:var(--shadow-md);pointer-events:none;z-index:10;white-space:nowrap"><div class="viz-cm-tip-t" style="color:${T.text};font-weight:600"></div></div></div>`;
    container.innerHTML = h;

    const tip = container.querySelector('.viz-cm-tip');
    const tipT = container.querySelector('.viz-cm-tip-t');
    container.querySelectorAll('.viz-cm-cell').forEach(c => {
      c.onmouseenter = function() {
        const r = this.dataset.r.replace(/([A-Z])/g, ' $1').trim(), co = this.dataset.c.replace(/([A-Z])/g, ' $1').trim(), v = +this.dataset.v;
        tipT.textContent = `${r} × ${co}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
        tip.style.display = 'block'; this.style.opacity = '.8';
      };
      c.onmousemove = function(e) {
        const rc = container.getBoundingClientRect();
        tip.style.left = (e.clientX - rc.left + 12) + 'px';
        tip.style.top = (e.clientY - rc.top - 35) + 'px';
      };
      c.onmouseleave = function() { tip.style.display = 'none'; this.style.opacity = '1'; };
    });
  }

  function destroy() {
    if (_container) { _container.innerHTML = ''; _container = null; }
  }

  window.VizCorrelationMatrix = { render, destroy };
})();
