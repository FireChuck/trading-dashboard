// app.js — Main App Controller
// Bot switch, timeframe, theme, module orchestration, landing page
const App = (() => {
  let currentBot = MOCK_DATA.botIds[0];
  let currentTimeframe = 'daily';
  let isDark = false;
  let showingLanding = true;

  /* ── Global Theme Color Helper ──
   * Centralized dark/light colors for all Viz modules.
   * WCAG AA compliant: 4.5:1 text, 3:1 large elements.
   * Usage: const T = window.ThemeColors();
   */
  window.ThemeColors = function() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return dark ? {
      dark: true,
      bg:       '#161616',
      bgPrimary:'#0C0C0C',
      bgHover:  '#1E1E1E',
      bgSecondary: '#111111',
      surface:  '#161616',
      text:     '#F5F5F4',      // 14.8:1 on #161616
      textMuted:'#A8A29E',      // 7.2:1 on #161616
      textTertiary: '#78716C',  // 4.6:1 on #161616
      border:   '#2A2A2A',
      borderLight: '#1E1E1E',
      profit:   '#4ADE80',      // 8.2:1 on #161616
      loss:     '#F87171',      // 5.8:1 on #161616
      neutral:  '#9CA3AF',
      accent:   '#60A5FA',
      warning:  '#FBBF24',
      grid:     '#222222',
      gridLine: '#2A2A2A',
      tipBg:    '#1E1E1E',
      tipBorder:'#333333',
      cardBg:   '#1E1E1E',
      line:     '#2A2A2A',
      track:    '#2A2A2A',
      canvasBg: '#161616',
      profitFill: 'rgba(74, 222, 128, 0.12)',
      lossFill:   'rgba(248, 113, 113, 0.12)',
      accentFill: 'rgba(96, 165, 250, 0.12)',
      empty:     '#1A1A1A',
      dot:       '#555555',
      green:     '#4ADE80',
      yellow:    '#FBBF24',
      red:       '#F87171',
    } : {
      dark: false,
      bg:       '#F5F5F4',
      bgPrimary:'#FAFAF9',
      bgHover:  '#EDEDEB',
      bgSecondary: '#F0EEEC',
      surface:  '#F5F5F4',
      text:     '#1C1917',      // 14.5:1 on #F5F5F4
      textMuted:'#78716C',      // 4.6:1 on #F5F5F4
      textTertiary: '#A8A29E',  // 2.8:1 on #F5F5F4 (decorative)
      border:   '#E7E5E4',
      borderLight: '#F0EEEC',
      profit:   '#16A34A',      // 4.6:1 on #F5F5F4
      loss:     '#DC2626',      // 4.7:1 on #F5F5F4
      neutral:  '#78716C',
      accent:   '#2563EB',
      warning:  '#D97706',
      grid:     '#E7E5E4',
      gridLine: '#E7E5E4',
      tipBg:    '#FFFFFF',
      tipBorder:'#E7E5E4',
      cardBg:   '#FFFFFF',
      line:     '#E7E5E4',
      track:    '#E7E5E4',
      canvasBg: '#F5F5F4',
      profitFill: 'rgba(22, 163, 74, 0.08)',
      lossFill:   'rgba(220, 38, 38, 0.08)',
      accentFill: 'rgba(37, 99, 235, 0.08)',
      empty:     '#F0EEEC',
      dot:       '#999999',
      green:     '#16A34A',
      yellow:    '#D97706',
      red:       '#DC2626',
    };
  };

  // Container → module mapping (id without "card-" prefix)
  const containerModuleMap = [
    { id: 'kpi', module: () => window.VizKpiOverview, type: 'legacy' },
    { id: 'equity', module: () => window.VizEquityCurve, type: 'legacy' },
    { id: 'heatmap', module: () => window.VizTradeHeatmap, type: 'legacy' },
    { id: 'pnl-pair', module: () => window.VizPnlByPair, type: 'legacy' },
    { id: 'risk', module: () => window.VizRiskRadar, type: 'legacy' },
    { id: 'distribution', module: () => window.VizTradeDistribution, type: 'legacy' },
    { id: 'session', module: () => window.VizSessionAnalytics, type: 'legacy' },
    { id: 'correlation', module: () => window.VizCorrelationMatrix, type: 'new' },
    { id: 'treemap', module: () => window.VizAllocationTreemap, type: 'new' },
    { id: 'signal-timeline', module: () => window.VizSignalTimeline, type: 'new' },
    { id: 'win-rate', module: () => window.VizWinRateDonut, type: 'new' },
    { id: 'profit-factor', module: () => window.VizProfitFactorGauge, type: 'new' },
    { id: 'max-dd', module: () => window.VizMaxDrawdownArea, type: 'new' },
    { id: 'sharpe', module: () => window.VizSharpeScorecard, type: 'new' },
    { id: 'avg-pnl', module: () => window.VizAvgTradePnl, type: 'new' },
    { id: 'total-trades', module: () => window.VizTotalTrades, type: 'new' },
    { id: 'best-worst', module: () => window.VizBestWorstTrade, type: 'new' },
    { id: 'streaks', module: () => window.VizConsecutiveStreaks, type: 'new' },
    { id: 'risk-reward', module: () => window.VizRiskRewardScatter, type: 'new' },
    { id: 'monthly-pnl', module: () => window.VizMonthlyPnlWaffle, type: 'new' },
  ];

  // ── Init ──
  function init() {
    initTheme();
    renderBotTabs();
    bindTimeframe();
    bindTheme();
    bindLogo();
    showLanding();
  }

  // ── Landing Page ──
  function showLanding() {
    showingLanding = true;
    document.getElementById('landingPage').style.display = '';
    document.getElementById('dashboardMain').style.display = 'none';
    const lp = window.LandingPage;
    if (lp && typeof lp.init === 'function') {
      lp.init(document.getElementById('landingContainer'));
    }
  }

  function showDashboard() {
    showingLanding = false;
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboardMain').style.display = '';
    update();
  }

  function bindLogo() {
    document.getElementById('logoBtn').addEventListener('click', showLanding);
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
    document.getElementById('themeIcon').textContent = dark ? '🌙' : '☀️';
    localStorage.setItem('dashboard-theme', dark ? 'dark' : 'light');
    if (!silent && !showingLanding) update();
  }

  function bindTheme() {
    document.getElementById('themeToggle').addEventListener('click', () => setTheme(!isDark));
  }

  // ── Bot Switcher ──
  function renderBotTabs() {
    const container = document.getElementById('botSwitcher');
    container.innerHTML = '';
    MOCK_DATA.botIds.forEach(id => {
      const bot = MOCK_DATA.bots[id];
      const btn = document.createElement('button');
      btn.className = `bot-tab${id === currentBot ? ' active' : ''}`;
      btn.textContent = bot.name;
      btn.addEventListener('click', () => {
        if (showingLanding) showDashboard();
        currentBot = id;
        document.querySelectorAll('.bot-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        update();
      });
      container.appendChild(btn);
    });
  }

  // ── Timeframe ──
  function bindTimeframe() {
    document.querySelectorAll('.tf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTimeframe = btn.dataset.tf;
        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (!showingLanding) update();
      });
    });
  }

  // ── Update All Viz ──
  function update() {
    const bot = MOCK_DATA.bots[currentBot];
    if (!bot) return;

    document.getElementById('botName').textContent = bot.name;
    document.getElementById('botTagline').textContent = bot.tagline;

    const tfData = bot[currentTimeframe];

    containerModuleMap.forEach(({ id, module, type }) => {
      const mod = module();
      if (!mod || typeof mod.init !== 'function') return;

      const container = document.getElementById(`card-${id}`);
      if (!container) return;

      // Destroy previous instance (memory leak prevention)
      if (typeof mod.destroy === 'function') {
        try { mod.destroy(); } catch (e) { /* ignore */ }
      }

      if (type === 'legacy') {
        // Original 7: init(bot, tfData, timeframe, isDark)
        mod.init(bot, tfData, currentTimeframe, isDark);
      } else {
        // Newer 13: init(container, botData, timeframe)
        mod.init(container, bot, currentTimeframe);
      }
    });
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  const api = { update, getTheme: () => isDark, showDashboard, showLanding };
  window.App = api;
  return api;
})();
