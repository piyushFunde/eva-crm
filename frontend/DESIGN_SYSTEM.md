# EVA CRM — Design System

Standardized design tokens to ensure consistent UI across the application.

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2563EB` | Buttons, links, active states |
| Primary Light | `#EFF6FF` | Backgrounds, highlights |
| Primary Dark | `#1D4ED8` | Hover states |
| Success | `#16A34A` | Collected status, positive actions |
| Success Light | `#F0FDF4` | Success backgrounds |
| Danger | `#DC2626` | Errors, overdue, destructive actions |
| Danger Light | `#FEF2F2` | Error backgrounds |
| Warning | `#D97706` | Pending status, partial payments |
| Warning Light | `#FFFBEB` | Warning backgrounds |
| Background | `#F9FAFB` | Page background |
| Surface | `#FFFFFF` | Cards, modals |
| Border | `#E5E7EB` | Borders, dividers |
| Text | `#111827` | Primary text |
| Muted | `#6B7280` | Secondary text |

## Typography

| Property | Value |
|----------|-------|
| Font Family | `Inter, system-ui, -apple-system, sans-serif` |
| Weights Used | 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extrabold) |
| Base Size | `15px` (buttons, inputs) |
| Small Text | `12-13px` (badges, captions) |
| Headings | `18-24px` |

## Spacing

Based on 4px grid (Tailwind default). Common values:
- `4px` (p-1) — Tight spacing
- `8px` (p-2) — Compact
- `12px` (p-3) — Default inner
- `16px` (p-4) — Standard card padding
- `20px` (p-5) — Section spacing

## Border Radius

| Element | Radius | Tailwind Class |
|---------|--------|---------------|
| Buttons | `10px` | `rounded-btn` |
| Cards | `14px` | `rounded-card` |
| Badges | `9999px` | `rounded-full` |
| Inputs | `10px` | `rounded-btn` |
| Modals | `20px` (top corners) | Custom |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| Card | `0 1px 4px rgba(0,0,0,0.06)` | Default card shadow |
| Card MD | `0 4px 12px rgba(0,0,0,0.08)` | Elevated cards |
| Card LG | `0 8px 24px rgba(0,0,0,0.10)` | Prominent cards |
| Modal | `0 -4px 32px rgba(0,0,0,0.12)` | Bottom sheet modals |
| Nav | `0 -1px 3px rgba(0,0,0,0.06)` | Bottom navigation |

## Touch Targets

| Element | Min Height | Min Width |
|---------|-----------|-----------|
| Primary Buttons | `48px` | — |
| Call/Collect Buttons | `44px` | — |
| Nav Tabs | `64px` (total nav height) | Equal flex |
| Input Fields | `48px` (with padding) | `100%` |

## Component Variants

### Buttons
- **Primary** (`btn-primary`) — Blue, white text
- **Success** (`btn-success`) — Green, white text
- **Outline** (`btn-outline`) — White, blue border/text
- **Call** (`btn-call`) — Light green bg, green text
- **Collect** (`btn-collect`) — Light blue bg, blue text

### Badges
- **Pending** (`badge-pending`) — Amber bg
- **Collected** (`badge-collected`) — Green bg
- **Partial** (`badge-partial`) — Blue bg

### Sync Status
- 🟢 `synced` — Green dot
- 🟡 `pending` — Amber dot (pulsing)
- 🔴 `offline` — Red dot

## Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fade-in` | `200ms` | `ease-out` | Page transitions, dropdowns |
| `slide-up` | `300ms` | `cubic-bezier(0.34,1.56,0.64,1)` | Bottom sheet modals |
| `pulse-soft` | `2000ms` | `ease-in-out` (infinite) | Pending sync indicator |
| `btn-press` | `100ms` | `ease` | Button press feedback (scale 0.97) |

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages | PascalCase | `Dashboard.jsx` |
| Components | PascalCase | `TopBar.jsx` |
| Hooks | camelCase with `use` prefix | `useAuth.js` |
| Utils | camelCase | `formatters.js` |
| Constants | camelCase | `constants.js` |
| Contexts | PascalCase + Context suffix | `AuthContext.jsx` |
