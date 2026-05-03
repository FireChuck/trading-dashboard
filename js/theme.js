// theme.js — Dark/Light mode with system preference detection + localStorage
(function () {
  const STORAGE_KEY = 'dashboard-theme';

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function resolveTheme() {
    return getStoredTheme() || getSystemTheme();
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    // Dispatch for viz modules that listen
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    apply(current === 'dark' ? 'light' : 'dark');
  }

  // Init: apply resolved theme immediately (before paint if possible)
  apply(resolveTheme());

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) apply(e.matches ? 'dark' : 'light');
  });

  // Expose
  window.Theme = { toggle, apply, current: () => document.documentElement.getAttribute('data-theme') || 'light' };
  window.ThemeColors = (() => {
    function get(p) { return getComputedStyle(document.documentElement).getPropertyValue(p).trim(); }
    return function () {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      return {
        dark, bg: get('--bg-primary'), bgSecondary: get('--bg-surface'),
        cardBg: get('--bg-surface'), text: get('--text-primary'),
        textMuted: get('--text-muted'), textContent: get('--text-secondary'),
        muted: get('--text-muted'), profit: get('--profit'), loss: get('--loss'),
        red: get('--loss'), green: get('--profit'), yellow: get('--warning'),
        accent: get('--accent'), grid: get('--chart-grid'), gridLine: get('--chart-grid'),
        border: get('--border-color'), canvasBg: get('--bg-surface'),
        tipBg: get('--tooltip-bg'), tipBorder: get('--tooltip-border'),
        lossFill: get('--loss-bg'),
      };
    };
  })();
})();
