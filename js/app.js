// app.js — SPA Controller
// Hash-based routing, lazy Chart.js loading, viz lifecycle management
const App = (() => {
  // ── State ──
  let currentBot = null;
  let currentTimeframe = 'daily';
  let isDark = false;
  let Chart = null; // lazy-loaded Chart.js reference
  let chartLoading = null; // Promise while loading
  let currentViz = null; // { name, destroy } of active viz
  let showingLanding = true;

  // ── Viz Registry (9 visualizations) ──
  // file names match actual JS files in /js/
  const VIZ_META = {
    'kpi-overview':         { label: 'KPI Overview',         file: 'viz-kpi-overview',         icon: '📋' },
    'equity-curve':         { label: 'Equity Curve',         file: 'viz-equity-curve',         icon: '📈' },
    'pnl-by-pair':          { label: 'P&L by Pair',          file: 'viz-pnl-by-pair',          icon: '💱' },
    'avg-trade-pnl':        { label: 'Avg Trade P&L',        file: 'viz-avg-trade-pnl',        icon: '📊' },
    'max-drawdown':         { label: 'Max Drawdown',         file: 'viz-max-drawdown',         icon: '📉' },
    'win-rate':             { label: 'Win Rate',             file: 'viz-win-rate',             icon: '🎯' },
    'profit-factor':        { label: 'Profit Factor',        file: 'viz-profit-factor',        icon: '⚡' },
    'sharpe':               { label: 'Sharpe Ratio',         file: 'viz-sharpe',               icon: '📐' },
    'trade-heatmap':        { label: 'Trade Heatmap',        file: 'viz-trade-heatmap',        icon: '🗺️' },
  };

  // ── DOM refs ──
  const $ = id => document.getElementById(id);
  const appEl = () => $('app');
  const sidebarEl = () => $('sidebar');
  const overlayEl = () => $('sidebarOverlay');
  const botSelect = () => $('botSelect');
  const tfSelect = () => $('timeframeSelect');
  const themeIcon = () => $('themeIcon');
  const themeLabel = () => $('themeLabel');
  const topbarTitle = () => $('topbarTitle');

  // ── Chart.js Lazy Loader ──
  async function ensureChart() {
    if (Chart) return Chart;
    if (chartLoading) return chartLoading;
    chartLoading = (async () => {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.7/+esm');
        Chart = mod.Chart;
        window.Chart = Chart; // expose for legacy viz modules
        return Chart;
      } catch (e) {
        console.error('Failed to lazy-load Chart.js:', e);
        chartLoading = null;
        throw e;
      }
    })();
    return chartLoading;
  }

  // ── Theme ──
  function initTheme() {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme(true, true);
    }
  }

  function setTheme(dark, silent) {
    isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (themeIcon()) themeIcon().textContent = dark ? '🌙' : '☀️';
    if (themeLabel()) themeLabel().textContent = dark ? 'Dark' : 'Light';
    localStorage.setItem('dashboard-theme', dark ? 'dark' : 'light');
    if (!silent && !showingLanding) reRenderCurrentViz();
  }

  // ── Sidebar / Mobile ──
  function openSidebar() {
    sidebarEl().classList.add('open');
    overlayEl().classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebarEl().classList.remove('open');
    overlayEl().classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateActiveNav(vizName) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const isActive = item.dataset.viz === vizName || (vizName === 'kpi-overview' && item.dataset.viz === 'dashboard');
      item.classList.toggle('active', isActive);
    });
    // Update topbar title
    if (topbarTitle()) {
      if (vizName === 'compare') {
        topbarTitle().textContent = '⚖️ Compare Bots';
      } else if (vizName === 'kpi-overview') {
        topbarTitle().textContent = '📋 KPI Overview';
      } else if (VIZ_META[vizName]) {
        topbarTitle().textContent = VIZ_META[vizName].icon + ' ' + VIZ_META[vizName].label;
      }
    }
  }

  // ── Bot Selector ──
  function initBotSelector() {
    const select = botSelect();
    if (!select || typeof MOCK_DATA === 'undefined') return;
    select.innerHTML = '';
    MOCK_DATA.botIds.forEach(id => {
      const bot = MOCK_DATA.bots[id];
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = bot.name;
      select.appendChild(opt);
    });
    currentBot = MOCK_DATA.botIds[0];
    select.addEventListener('change', () => {
      currentBot = select.value;
      if (!showingLanding) reRenderCurrentViz();
    });
  }

  // ── Timeframe ──
  function initTimeframe() {
    const select = tfSelect();
    if (!select) return;
    select.addEventListener('change', () => {
      currentTimeframe = select.value;
      if (!showingLanding) reRenderCurrentViz();
    });
  }

  // ── Global Debounced ResizeObserver (shared by all viz modules) ──
  const GlobalResize = (() => {
    const _callbacks = new Map();
    let _timer = null;
    const _observer = new ResizeObserver((entries) => {
      if (_timer) clearTimeout(_timer);
      _timer = setTimeout(() => {
        for (const entry of entries) {
          const cb = _callbacks.get(entry.target);
          if (cb) cb(entry);
        }
        _timer = null;
      }, 200);
    });
    return {
      observe(el, cb) { _callbacks.set(el, cb); _observer.observe(el); },
      unobserve(el) { _callbacks.delete(el); _observer.unobserve(el); },
      destroy() { _observer.disconnect(); _callbacks.clear(); if (_timer) clearTimeout(_timer); },
    };
  })();
  window.GlobalResize = GlobalResize;

  // ── Shared Chart.js Performance Defaults ──
  const CHART_PERF_DEFAULTS = {
    animation: false,
    decimation: { enabled: true, threshold: 100 },
    pointRadius: 0,
    pointHoverRadius: 4,
    elements: { line: { borderWidth: 1.5 } },
  };
  window.ChartPerfDefaults = CHART_PERF_DEFAULTS;

  // ── Viz Lifecycle ──
  let _destroying = false;
  function destroyCurrentViz() {
    if (_destroying) return; // Double-Render-Guard
    _destroying = true;
    try {
      if (currentViz && typeof currentViz.destroy === 'function') {
        try { currentViz.destroy(); } catch (e) { /* ignore */ }
      }
      currentViz = null;
      const app = appEl();
      if (app) app.innerHTML = '';
    } finally {
      _destroying = false;
    }
  }

  function reRenderCurrentViz() {
    const hash = window.location.hash || '#/dashboard';
    routeTo(hash, true);
  }

  // ── Router ──
  function parseRoute(hash) {
    hash = hash || '#/dashboard';
    // #/dashboard or #/ → kpi-overview
    if (hash === '#/' || hash === '#/dashboard') return { type: 'viz', name: 'kpi-overview' };
    // #/viz/<name>
    const vizMatch = hash.match(/^#\/viz\/([a-z0-9-]+)$/);
    if (vizMatch) return { type: 'viz', name: vizMatch[1] };
    // #/compare
    if (hash === '#/compare') return { type: 'compare' };
    // fallback
    return { type: 'viz', name: 'kpi-overview' };
  }

  async function routeTo(hash, isRerender) {
    if (!isRerender) {
      showingLanding = false;
    }
    const route = parseRoute(hash);
    destroyCurrentViz();

    if (route.type === 'compare') {
      updateActiveNav('compare');
      await renderCompare();
      return;
    }

    const vizName = route.name;
    const meta = VIZ_META[vizName];
    if (!meta) {
      appEl().innerHTML = '<div class="viz-error">Unknown visualization</div>';
      return;
    }

    updateActiveNav(vizName);

    // Load viz module dynamically — ES module with export function render()
    try {
      const mod = await import(`./js/${meta.file}.js`);
      const VizModule = mod.default || mod;

      // Ensure Chart.js is loaded (except for kpi-overview which may be DOM-only)
      if (vizName !== 'kpi-overview') {
        await ensureChart();
      }

      // Build botData object for the viz module API: render(container, botData, options)
      const botData = (typeof getMockData === 'function')
        ? getMockData(currentBot, currentTimeframe)
        : null;

      const app = appEl();
      const container = document.createElement('div');
      container.className = 'viz-container';
      container.id = `viz-${vizName}`;
      app.appendChild(container);

      if (typeof VizModule.render === 'function') {
        const destroyFn = VizModule.render(container, botData, { botId: currentBot, timeframe: currentTimeframe });
        currentViz = {
          name: vizName,
          destroy: () => {
            if (typeof VizModule.destroy === 'function') VizModule.destroy();
            else if (typeof destroyFn === 'function') destroyFn();
          }
        };
      } else {
        throw new Error(`Viz module "${vizName}" has no render function`);
      }
    } catch (e) {
      console.error(`Failed to load viz "${vizName}":`, e);
      appEl().innerHTML = `<div class="viz-error">Failed to load visualization: ${e.message}</div>`;
    }
  }

  function getBotData() {
    if (typeof MOCK_DATA === 'undefined') return null;
    const bot = MOCK_DATA.bots[currentBot];
    if (!bot) return null;
    return {
      botId: currentBot,
      bot,
      timeframe: currentTimeframe,
      data: bot[currentTimeframe],
      getMockData: () => typeof getMockData === 'function' ? getMockData(currentBot, currentTimeframe) : null,
    };
  }

  // ── Compare View ──
  async function renderCompare() {
    await ensureChart();
    try {
      const mod = await import('./js/compare.js');
      const CompareModule = mod.default || mod.CompareModule || mod;
      if (!CompareModule || typeof CompareModule.render !== 'function') throw new Error('Compare module has no render function');
      const app = appEl();
      const container = document.createElement('div');
      container.className = 'compare-wrapper';
      container.id = 'compare-view';
      app.appendChild(container);

      // Pass MOCK_DATA so compare can build bot selectors
      const destroyFn = await CompareModule.render(container, typeof MOCK_DATA !== 'undefined' ? MOCK_DATA : {}, {
        Chart,
        getMockData: typeof getMockData === 'function' ? getMockData : null,
      });
      currentViz = {
        name: 'compare',
        destroy: () => {
          if (typeof CompareModule.destroy === 'function') CompareModule.destroy();
          else if (typeof destroyFn === 'function') destroyFn();
        }
      };
    } catch (e) {
      console.error('Failed to load compare module:', e);
      appEl().innerHTML = `<div class="viz-error">Compare view not available: ${e.message}</div>`;
    }
  }

  // ── Landing Page ──
  async function showLanding() {
    showingLanding = true;
    destroyCurrentViz();
    updateActiveNav('landing');
    if (topbarTitle()) topbarTitle().textContent = '📊 Trading Analytics';

    try {
      await import('./js/landing-page.js');
      const LP = window.LandingPage;
      if (!LP || typeof LP.init !== 'function') throw new Error('LandingPage not found');
      const app = appEl();
      const container = document.createElement('div');
      container.className = 'landing-container';
      container.id = 'landingContainer';
      app.appendChild(container);
      LP.init(container);
      currentViz = {
        name: 'landing',
        destroy: () => {
          if (typeof LP.destroy === 'function') LP.destroy();
        }
      };
    } catch (e) {
      console.warn('Landing page not available, showing dashboard:', e);
      window.location.hash = '#/dashboard';
    }
  }

  // ── Hash Change Handler ──
  function onHashChange() {
    const hash = window.location.hash;
    if (hash === '#/' || hash === '' || hash === '#' || hash === '#/landing') {
      showLanding();
    } else {
      routeTo(hash);
    }
    closeSidebar();
  }

  // ── Event Bindings ──
  function bindEvents() {
    // Hash routing
    window.addEventListener('hashchange', onHashChange);

    // Theme toggle
    const tt = $('themeToggle');
    if (tt) tt.addEventListener('click', () => setTheme(!isDark));

    // Hamburger
    const hb = $('hamburgerBtn');
    if (hb) hb.addEventListener('click', openSidebar);

    // Sidebar close
    const sc = $('sidebarClose');
    if (sc) sc.addEventListener('click', closeSidebar);

    // Overlay close
    const ov = $('sidebarOverlay');
    if (ov) ov.addEventListener('click', closeSidebar);

    // Logo → landing
    const lb = $('logoBtn');
    if (lb) lb.addEventListener('click', () => { window.location.hash = '#/landing'; });

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const viz = item.dataset.viz;
        if (viz === 'dashboard') {
          window.location.hash = '#/dashboard';
        } else if (viz === 'compare') {
          window.location.hash = '#/compare';
        } else {
          window.location.hash = `#/viz/${viz}`;
        }
      });
    });
  }

  // ── Init ──
  function init() {
    initTheme();
    initBotSelector();
    initTimeframe();
    bindEvents();

    // Initial route
    const hash = window.location.hash;
    if (hash && hash !== '#' && hash !== '#/' && hash !== '#/landing') {
      routeTo(hash);
    } else {
      showLanding();
    }
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ──
  return {
    getCurrentBot: () => currentBot,
    getCurrentTimeframe: () => currentTimeframe,
    getTheme: () => isDark,
    ensureChart,
    showLanding,
    showDashboard: () => { window.location.hash = '#/dashboard'; },
    getBotData,
    navigate: (hash) => { window.location.hash = hash; },
  };
})();

window.App = App;
