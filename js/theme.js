// theme.js — Provides window.ThemeColors() for all viz modules
// Reads CSS custom properties and maps them to the T.* namespace
window.ThemeColors = (() => {
  function getStyle(prop) {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  function read() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      dark,
      bg: getStyle('--bg-primary'),
      bgSecondary: getStyle('--bg-secondary'),
      cardBg: getStyle('--bg-surface'),
      text: getStyle('--text-primary'),
      textMuted: getStyle('--text-muted'),
      textTertiary: getStyle('--text-tertiary'),
      textContent: getStyle('--text-secondary'),
      muted: getStyle('--text-muted'),
      profit: getStyle('--profit'),
      loss: getStyle('--loss'),
      red: getStyle('--loss'),
      green: getStyle('--profit'),
      yellow: getStyle('--warning'),
      accent: getStyle('--accent'),
      grid: getStyle('--chart-grid'),
      gridLine: getStyle('--chart-grid'),
      line: getStyle('--border-light'),
      border: getStyle('--border-color'),
      canvasBg: getStyle('--canvas-bg'),
      track: getStyle('--border-light'),
      dot: getStyle('--text-secondary'),
      tipBg: getStyle('--tooltip-bg'),
      tipBorder: getStyle('--tooltip-border'),
      wm: getStyle('--text-tertiary'),
      empty: getStyle('--bg-surface'),
      lossFill: getStyle('--loss-bg'),
    };
  }

  return read;
})();
