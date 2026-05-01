# PRODUCT.md — Trading Performance Dashboard

## Register
**product** — Tool-UI for futures trading performance analysis.

## Users

### Primary User: Niklas
- **Role:** Prop-firm futures trader (NQ/MNQ)
- **Strategy:** SMC-based reverse strategy
- **Goal:** Review session performance, track prop-firm rules compliance, identify patterns
- **Context:** Trades London (08:00–11:00) and New York (15:30–17:00) sessions
- **Devices:** Desktop (27" monitor), focused analytical use

### Secondary User: Paul
- **Role:** Co-developer, dashboard operator
- **Goal:** Monitor Niklas's trading data, validate dashboard functionality

## Product Purpose
A single-screen trading performance dashboard for reviewing futures strategy results. It surfaces core statistics (win rate, PnL, profit factor, max drawdown, average trades per week), session-level breakdowns, and prop-firm rule tracking — all without requiring active market connectivity.

## Brand Personality
- **Professional** — No flashy animations, no gamification. Data speaks.
- **Data-driven** — Every pixel serves a measurement purpose.
- **Calm** — Trading is stressful enough. The dashboard should reduce cognitive load, not add to it.
- **Precise** — Numbers are accurate, states are unambiguous, filters are instant.

## Anti-References
- Navy + gold finance cliché (Bloomberg wannabe)
- Neon crypto aesthetic (glowing greens/reds, dark gradients)
- Generic SaaS card-grid overload (12 identical cards in a 4×3 grid)
- Gamified trading UIs (confetti on wins, skull emojis on losses)
- Overly decorated charts with unnecessary gradients and 3D effects

## Design Principles
1. **Density over decoration** — Fit meaningful data on screen without clutter. White space is structural, not decorative.
2. **Glanceable hierarchy** — The most important metric (session PnL) should be the fastest thing to read. Secondary stats are present but recessive.
3. **State clarity** — Win, loss, break-even, and neutral states must be instantly distinguishable through color alone (WCAG AA contrast).
4. **Filter-first** — The session filter is the primary navigation. Changing it should update everything on screen in one pass.
5. **Progressive disclosure** — Show the summary first. Trade-level detail is available but not the default view.

## Accessibility
- **WCAG AA** compliance (color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI elements)
- Keyboard-navigable filters and table rows
- Screen-reader-friendly table structure with proper ARIA labels
- Color is never the sole indicator — paired with text labels or icons

## Scope
- Single-screen dashboard (no routing, no multi-page navigation)
- Static data source (mock data / future API integration)
- Desktop-first (responsive down to tablet, mobile not a target)
