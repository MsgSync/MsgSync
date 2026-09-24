---
name: Carrier NOC Console
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#b395ff'
  on-tertiary-container: '#4900ae'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
  code-metric:
    fontFamily: JetBrains Mono, Fira Code, monospace
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  code-metric-lg:
    fontFamily: JetBrains Mono, Fira Code, monospace
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 0.75rem
  margin-desktop: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system targets mission-critical telecom network operations centers (NOC), high-throughput message routing infrastructure, and enterprise communications engineers. The UI projects unyielding reliability, clinical precision, and absolute spatial efficiency. Every pixel prioritizes sub-second comprehension during high-severity operational events.

The visual style blends dark industrial minimalism with precision aerospace console ergonomics. It leverages deep slate foundations, structural 1px grid borders, compact information density, and focused telemetry glows. Instead of decorative embellishments, the design system relies on tactical color-coded signals (cyan active paths, emerald link health, amber queue latency, and red packet drops) against a low-fatigue slate base.

## Colors

The palette operates on calibrated contrast ratios compliant with WCAG AAA for active telemetry readout.

- **Canvas Base (`#0B0F17`)**: Deep neutral slate providing zero glare during long monitoring shifts.
- **Surface Elevation 1 (`#111827`)**: Deep slate card containers and console panels.
- **Surface Elevation 2 (`#1E293B`)**: Intermediary headers, toolbar rows, and active cell treatments.
- **Structural Outlines (`#1F2937`)**: Crisp 1px delineations between metrics and streams.
- **Primary Telemetry (`#06B6D4`)**: Electric Cyan reserved for focus states, selected route vectors, active throughput, and primary controls.
- **Operational Secondary (`#10B981`)**: Emerald for nominal states: healthy links, bound SMPP sessions, 200 OK throughput, and connected nodes.
- **Operational Warning (`#F59E0B`)**: Amber for queue congestion, backpressure warnings, retry latency, and window exhaustion.
- **Operational Critical (`#EF4444`)**: Rose/Red for link drops, dead-letter pipelines, carrier rejections, and TLS handshake failures.
- **Developer / Protocol (`#8B5CF6`)**: Indigo/Violet for signaling types, hex traces, point codes, and payload formats.

## Typography

Typography prioritizes tabular figures, compact vertical footprints, and clear visual hierarchy.

- **Primary Typeface (`Inter`)**: Deployed across system headers, structural labels, table records, and navigation. Rendered with explicit font-feature-settings: `"cv02", "cv03", "cv04", "cv11", "tnum"` to ensure tabular alignment in high-density listings.
- **Monospace Telemetry Stack (`JetBrains Mono`, `Fira Code`, `monospace`)**: Required for all payload hex IDs, SS7/SIGTRAN Point Codes, routing prefixes, IP/CIDR blocks, and real-time MPS counters.
- **Labels & Overlines**: Uppercase, tight, and spaced (`0.04em` to `0.06em`) to frame telemetry panels without visual dominance.

## Layout & Spacing

The layout model enforces a high-density, screen-filling fluid grid architecture optimized for multi-monitor NOC displays (1440px to 4K resolutions) with rigid fallback modes for portable engineering laptops.

- **Grid Architecture**: 24-column micro-grid for desktop console dashboards, reducing down to 12 columns at tablet resolutions and 4 columns on emergency mobile views. Gutters lock at `12px` (`0.75rem`) to maximize telemetry visibility per square inch.
- **Canvas Edge Margins**: Fixed at `20px` (`1.25rem`) on full-screen NOC views to preserve edge real estate while maintaining separation from operating system window chrome.
- **Vertical Rhythm**: Built upon a strict 4px base coordinate scale. Standard panel padding uses `space-md` (`12px`) for interior density and `space-sm` (`8px`) for tight operational toolbars.

## Elevation & Depth

This design system avoids diffused ambient blur shadows in favor of 1px structured wireframes and subtle luminous telemetry boundaries.

- **Layer 0 (Canvas Ground)**: `#0B0F17` baseline monitor plane.
- **Layer 1 (Card & Module Deck)**: `#111827` backed with a 1px solid border of `#1F2937`.
- **Layer 2 (Header / Inspector Floating Panels)**: `#161F30` backed with a 1px solid border of `#374151`.
- **Active Operational Glow**: Critical operational alerts and selected telemetry nodes shed a concentrated 0px blur spread with a 4px glow:
  - Nominal link: `box-shadow: 0 0 0 1px #10B981, 0 0 8px rgba(16, 185, 129, 0.25)`
  - Primary route: `box-shadow: 0 0 0 1px #06B6D4, 0 0 8px rgba(6, 182, 212, 0.25)`
  - Alert node: `box-shadow: 0 0 0 1px #EF4444, 0 0 8px rgba(239, 68, 68, 0.35)`

## Shapes

The shape system is set to `1` (Soft), creating tight 4px (`0.25rem`) corner rounding. This produces an engineered, terminal-grade profile that aligns with continuous tabular grids.

- **Micro elements (Badges, Chips, Segmented Radios)**: `rounded` (`4px` / `0.25rem`).
- **Standard Controls (Inputs, Buttons, Dropdowns)**: `rounded` (`4px` / `0.25rem`).
- **Structural Containers (Cards, Stream Viewports, NOC Grids)**: `rounded-lg` (`8px` / `0.5rem`).
- **Status Dots & Circular Node Indicators**: Strict 50% circular boundaries (`rounded-full`).

## Components

### Buttons & Operational Triggers
- **Primary (Action/Deploy)**: Solid `#06B6D4` background, `#0B0F17` bold typography, 4px corner radius, zero shadow except on hover (`box-shadow: 0 0 12px rgba(6, 182, 212, 0.4)`). Height locked to 32px for standard and 26px for micro.
- **Secondary (Interlock/Bypass)**: Transparent background, 1px border of `#1F2937`, text `#E5E7EB`. Hover: border `#374151`, background `#1F2937/40`.
- **Destructive (E-Stop/Route Kill)**: Dark tinted crimson background (`#450A0A`), 1px border of `#EF4444`, text `#FCA5A5`.

### Chips & Protocol Tags
- Monospace labels with 2px horizontal padding and 1px borders.
- Backgrounds use a 12% alpha fill of the telemetry state:
  - Protocol Tag: `#8B5CF6/15` text `#C4B5FD` border `#8B5CF6/40`.
  - Upstream Status: `#10B981/15` text `#6EE7B7` border `#10B981/40`.
  - Queue Throttle: `#F59E0B/15` text `#FCD34D` border `#F59E0B/40`.

### Data Stream Tables & Grids
- 32px row heights with zero alternating striped fills; separation achieved strictly via horizontal 1px lines of `#1F2937`.
- Hover triggers full-row highlight in `#1E293B/60` with a 2px left border accent in `#06B6D4`.
- Numerical columns right-aligned with monospace font stack and explicit tabular figures.

### Form Inputs & Terminal Selectors
- Solid `#0F172A` background with crisp 1px `#1F2937` borders, inset padding 6px 10px.
- Focus state switches border to `#06B6D4` with a tight `0 0 0 1px #06B6D4` outline.
- Monospaced prefix indicators (e.g., `+`, `0x`, `CIDR`) rendered in muted `#64748B`.

### Telemetry Cards & Metric Blocks
- Slate container (`#111827`) bounded by `#1F2937`.
- Top-level micro-header with uppercase tracking label (`label-sm`), current value (`code-metric-lg`), and sparkline or route status strip along the card's bottom edge.