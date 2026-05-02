// app.js — Main App Controller
// Bot switch, timeframe, theme, module orchestration, landing page
const App = (() => {
  let currentBot = MOCK_DATA.botIds[0];
  let currentTimeframe = 'daily';
  let isDark = false;
  let showingLanding = true;

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

      if (type === 'legacy') {
        // Original 7: init(bot, tfData, timeframe, isDark)
        mod.init(bot, tfData, currentTimeframe, isDark);
      } else {
        // Newer 13: init(container, botData, timeframe)
        // Newer modules access MockData/MockDataFinal globals internally
        // We pass the bot data from MOCK_DATA structure which has all fields
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

  return { update, getTheme: () => isDark, showDashboard, showLanding };
})();
