# DESIGN.md — Trading Performance Dashboard

## Register
**product** — Tool-UI

## Theme Scene
> Niklas sits at his trading desk at 9am, reviewing yesterday's session results on a 27-inch monitor in a focused, analytical mood. The room has warm ambient light.

This is not a dark-mode command center. It's a morning workspace — warm, grounded, calm. The dashboard should feel like looking at a well-organized spreadsheet, not a movie prop.

## Color Strategy: Restrained

**Primary palette:** Neutral base with a single warm accent.
- **Background:** `#FAFAF9` (warm off-white, stone-50 equivalent)
- **Surface/Panel:** `#F5F5F4` (stone-100) — for cards, sidebar, table header
- **Border:** `#E7E5E4` (stone-200) — subtle dividers, table gridlines
- **Text primary:** `#1C1917` (stone-900) — all body text, labels, values
- **Text secondary:** `#78716C` (stone-500) — timestamps, metadata, captions

**Semantic colors (data states):**
- **Profit/Win:** `#16A34A` (green-600) — positive PnL, winning trades
- **Loss:** `#DC2626` (red-600) — negative PnL, losing trades
- **Break-even:** `#78716C` (stone-500) — neutral, flat trades
- **Warning (prop-firm near limit):** `#D97706` (amber-600)
- **Critical (prop-firm limit hit):** `#DC2626` (red-600)

**Accent (sparingly):**
- `#2563EB` (blue-600) — only for interactive elements (active filter, selected row, links). Never for data.

**Design rule:** The semantic colors appear only in data cells, chart elements, and status indicators. The overall frame of the dashboard (backgrounds, borders, chrome) is entirely neutral.

## Typography

**System font stack** (product register allows this):
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

**Scale (modular, 1.25 ratio):**
| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-xs` | 11px | 500 | Table metadata, timestamps |
| `--text-sm` | 13px | 400 | Table body, secondary labels |
| `--text-base` | 15px | 400 | Default body, filter labels |
| `--text-lg` | 18px | 500 | Section headers, KPI values |
| `--text-xl` | 22px | 600 | Page title, hero metric |
| `--text-2xl` | 28px | 700 | Primary PnL display |
| `--text-mono` | 13px | 500 | Numerical data, trade values (monospace) |

**Numerical data** uses a monospace variant (`'SF Mono', 'Cascadia Code', 'Fira Code', monospace`) for alignment in tables and KPI cards.

## Spacing & Layout

**Grid:** 8px base unit. 4px for tight elements (table cell padding).

**Container:** Max-width 1440px, centered. Content padded 24px from edges.

**KPI Bar:** Horizontal strip, 4–5 metric cards in a row, 16px gap.
**Session Filter:** Inline pill/chip selector, visually connected to KPI bar.
**Trade Table:** Full-width, sticky header, sortable columns, max-height with scroll.
**Charts:** Inline below table or in a side panel (TBD by implementer).

## Component Treatment

**Cards (KPI):** 1px border, no shadow, subtle background difference. Label above, value below, aligned left.
**Table:** Clean gridlines only horizontal (between rows), no vertical lines. Hover highlights entire row with background shift to `#F5F5F4`.
**Buttons/Filters:** Minimal — text-based with underline or background pill on active. No bordered buttons for navigation.
**Status indicators:** Small dot (8px) or badge, color-coded, paired with text label.

## References
- **Linear** — density, neutral palette, data-first hierarchy
- **Raycast** — warm neutrals, restrained interaction states, system typography
- **Notion tables** — clean row hover, minimal chrome, monospace numbers

## Motion
- **None by default.** This is a data tool.
- If any transition: 150ms ease-out for filter changes and row hover only.
- No loading spinners — skeleton placeholders only.

## Dark Mode
- **Not in scope for MVP.** The restrained warm palette is the single theme.
- Future consideration: cool gray variant, not blue/purple dark mode.
