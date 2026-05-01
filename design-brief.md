# Design Brief — Trading Performance Dashboard

## 1. Feature Summary

A single-screen trading performance dashboard for futures prop-firm traders (NQ/MNQ). It displays core KPIs (win rate, PnL, profit factor, drawdown, avg trades/week), session-based filtering (London/NY), a detailed trade table, and prop-firm rule compliance indicators — all in a calm, data-dense layout designed for quick post-session review.

## 2. Primary User Action

**Filter by session → scan KPI bar → drill into trade table.** The user opens the dashboard after a trading session, selects the relevant session or date range, and reviews their performance metrics and individual trade results in one glance.

## 3. Design Direction

- **Color Strategy:** Restrained neutral (warm off-white base, stone palette) with semantic colors only for data states (green=profit, red=loss)
- **Theme:** Warm ambient trading desk — morning light, focused, analytical
- **Anchor References:** Linear (density + hierarchy), Raycast (warm neutrals + restrained interactions)
- **Typography:** System font stack, monospace for numerical data

## 4. Scope

- **Production-ready** single-screen dashboard
- Desktop-first (1440px optimal, tablet responsive, mobile excluded)
- Interactive: session filter, sortable table, prop-firm toggle
- Static data source (mock data for MVP, future API integration)
- No routing, no multi-page, no authentication

## 5. Layout Strategy

```
┌─────────────────────────────────────────────────────┐
│  Trading Dashboard          [Prop Firm Mode: ON/OFF] │
├─────────────────────────────────────────────────────┤
│  KPI BAR                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │WR    │ │PnL   │ │PF    │ │DD    │ │Trades/Wk │  │
│  │62%   │ │+$4.2k│ │1.85  │ │-$1.1k│ │3.4       │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘  │
├─────────────────────────────────────────────────────┤
│  SESSION FILTER                                      │
│  [All] [London] [New York]    Date: [Mar 2026 ▾]    │
├─────────────────────────────────────────────────────┤
│  TRADE TABLE (scrollable)                            │
│  Date | Session | Symbol | Dir | Entry | Exit | Pts  │
│  ─────────────────────────────────────────────────── │
│  03/28 | London  | NQ     | S   | 18520 | 18480 |+40 │
│  03/28 | London  | NQ     | B   | 18475 | 18490 |-15 │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

**Sections top-to-bottom:**
1. **Header bar** — Title left, prop-firm toggle right
2. **KPI strip** — 5 key metrics in a horizontal row
3. **Session filter** — Inline chips + optional date picker
4. **Trade table** — Full-width, sticky header, sortable, scrollable body

## 6. Key States

| State | Description |
|---|---|
| **Default (loaded)** | KPIs populated, table shows filtered trades, session filter on "All" |
| **Empty** | No trades match filter → centered message: "No trades found for this session." |
| **Loading** | Skeleton placeholders for KPI cards and table rows (no spinners) |
| **Error** | Data fetch failed → subtle error banner at top: "Could not load trade data." |
| **Prop Firm Mode ON** | Visual indicator in header; table highlights rule violations (2nd loss highlighted, daily stop after 1st win); warning badge on affected metrics |
| **Prop Firm Mode OFF** | Standard view, no rule-compliance indicators |

## 7. Interaction Model

- **Session filter:** Click to toggle between All / London / New York. Single-select, instant update.
- **Date picker (future):** Dropdown or calendar for month/date range selection.
- **Prop Firm toggle:** Switch in header. Toggles rule-compliance overlay on table and KPIs.
- **Table sort:** Click column headers to sort asc/desc. Active sort indicated by arrow icon.
- **Row hover:** Background shifts to surface color. No click action on rows (read-only for MVP).
- **KPI cards:** No interaction (display-only). Tooltip on hover showing calculation method.

## 8. Content Requirements

### Labels
- KPI labels: "Win Rate", "Total PnL", "Profit Factor", "Max Drawdown", "Avg Trades/Week"
- Session filter: "All Sessions", "London", "New York"
- Table headers: "Date", "Time", "Session", "Symbol", "Direction", "Entry", "Exit", "Points", "R-Multiple", "PnL"
- Direction values: "Long" / "Short"
- Prop Firm toggle label: "Prop Firm Mode"

### Empty State
- **No trades:** "No trades found for this session."
- **No data loaded:** (Loading skeleton — no text)

### Error State
- **Data failure:** "Could not load trade data. Please try again."

### Prop Firm Warnings
- **Near limit (1 loss):** "⚠ 1 loss today — next loss hits daily limit"
- **Limit hit (2 losses):** "🛑 Daily loss limit reached"
- **Win stop triggered:** "✓ Daily profit target reached — session stopped"

## 9. Recommended References (Impeccable Skill)
- `product.md` → register alignment
- `spatial-design.md` → layout density and section proportions
- `typography.md` → type scale and numerical data treatment
- `color-and-contrast.md` → neutral palette, semantic data colors, WCAG AA
- `interaction-design.md` → filter and hover state specifications
- `responsive-design.md` → tablet breakpoint behavior

## 10. Open Questions
1. Should the trade table show running PnL per day, or only closed-trade PnL? → **Closed-trade PnL for MVP.**
2. Is a monthly summary view needed alongside the session view? → **Out of scope for MVP. Session + date filter sufficient.**
3. Should the Fibonacci discount/premium filter be included in the table? → **No — deferred to later iteration.**
4. Chart integration (equity curve, session distribution)? → **Optional for MVP if time allows. Table is priority.**
