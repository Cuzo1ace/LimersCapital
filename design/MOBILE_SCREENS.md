# Mobile Screen Specifications — Limer's Capital

## Target Devices
- **Primary**: iPhone 14 (390x844), Samsung Galaxy A54 (393x873)
- **Secondary**: iPhone SE (375x667), Pixel 7 (412x915)
- **Frame**: 390x844 (standard mobile)

## Design System

### Colors (Dark Theme — Default)
| Token | Hex | Usage |
|-------|-----|-------|
| night | #0d0e10 | App background |
| night-2 | #121316 | Cards, modals |
| night-3 | #1e2022 | Elevated surfaces |
| sea | #00ffa3 | Primary CTA, positive values |
| coral | #bf81ff | Secondary accent, badges |
| sun | #FFCA3A | Warnings, streaks |
| down | #ff716c | Negative values, errors |
| txt | #fdfbfe | Primary text |
| txt-2 | #ababad | Secondary text |

### Typography
| Role | Font | Weight | Size (mobile) |
|------|------|--------|---------------|
| App title | Space Grotesk | 700 | 20px |
| Section heading | Space Grotesk | 600 | 16px |
| Body | Inter | 400 | 14px |
| Label | Inter | 500 | 12px |
| Caption | Inter | 400 | 11px |
| Mono (prices) | DM Mono | 400 | 14px |

### Touch Targets
- Minimum: 44x44px (WCAG 2.5.8)
- Comfortable: 48x48px (Material Design)
- Bottom nav icons: 48x48px hit area

---

## Screen List (Priority Order)

### 1. Home / Dashboard (Mobile)
- **Status bar**: theme-color #0d0e10
- **Header**: Logo (left) + compact wallet button (right) + hamburger menu
- **Price ticker**: Horizontal scrolling, 32px height
- **Hero card**: "Your Progress" — XP bar, streak flame, LP count
- **Quick actions**: 4-icon grid (Learn, Trade, Market, Portfolio)
- **Live prices**: Top 5 tokens, compact rows (icon + name + price + 24h%)
- **Community pulse**: 3 most recent activity feed items
- **Waitlist CTA**: If not signed up
- **Social proof bar**: User count + waitlist + nations

### 2. Bottom Navigation Bar (Persistent)
- 5 tabs: Home, Learn, Market, Trade, Portfolio
- Active = sea green fill + label
- Inactive = muted icon only
- Height: 56px + safe area inset
- Haptic feedback on tap (future)

### 3. Learn Module (Mobile)
- **Module cards**: Full-width, stacked vertically
- **Lesson view**: Clean reading layout, 16px body text
- **Quiz cards**: Single question per screen, swipe to advance
- **Progress ring**: Top of module page
- **Glossary**: Alphabetical jump-list (A-Z sidebar)

### 4. Market Overview (Mobile)
- **Search bar**: Sticky top, rounded pill shape
- **Filter chips**: Horizontal scroll (All, Solana, DeFi, Stablecoins)
- **Token list**: Compact rows — 56px height each
  - Left: icon (32px) + name/ticker
  - Right: price + sparkline (48px wide) + 24h%
- **Pull to refresh**: Overscroll gesture

### 5. Trade Screen (Mobile)
- **Chart**: TradingView, 60% of viewport height
- **Token selector**: Pill with icon + dropdown
- **Order form**: Compact — buy/sell toggle, amount input, slider for %
- **Recent trades**: Scrollable below form

### 6. Portfolio (Mobile)
- **Total value**: Large display at top
- **PnL badge**: Green/red chip with percentage
- **Holdings list**: Token rows with allocation pie chart header
- **Transaction history**: Date-grouped, expandable rows

### 7. Wallet Connect Sheet
- **Bottom sheet**: Slides up from bottom (not full screen)
- **Wallet options**: Phantom, Solflare, Backpack icons
- **QR code**: For desktop wallet connection
- **"What's a wallet?"**: Educational link

### 8. Mobile Navigation Drawer
- **Current**: Bottom sheet with 2-column grid
- **Redesign**: Cleaner grouping with section headers
  - Core: Dashboard, Learn, Market, Trade, Portfolio
  - Ecosystem: $LIMER, Competition, Community, Revenue
  - Info: Regulation, FAQ, Legal, About
- **User card**: Wallet address + tier badge + XP/LP at top
- **Settings row**: Theme toggle + language + network at bottom

### 9. Install Prompt (PWA)
- **Already built** — bottom banner with Install/Dismiss
- **Verify**: Looks good on all target devices

### 10. Offline State
- **Already built** — yellow top banner
- **Enhance**: Add cached data timestamp ("Prices from 2 min ago")

---

## Mobile-Specific Patterns

### Navigation
- Bottom tab bar (5 items) replaces current hamburger-only
- Swipe between adjacent tabs
- Pull-down for refresh on data screens

### Data Entry
- Large touch targets for trade inputs (48px height minimum)
- Numeric keyboard triggers for amount fields
- Haptic feedback on trade execution (future)

### Loading States
- Skeleton screens (already have Skeleton.jsx)
- Shimmer on price rows while loading
- Optimistic updates for LP/XP actions

### Safe Areas
- `viewport-fit=cover` (already set)
- Bottom nav respects `env(safe-area-inset-bottom)`
- Status bar area respects `env(safe-area-inset-top)`

---

## Penpot Project Structure

```
Limer's Capital Mobile
├── Components (shared library)
│   ├── Buttons (Primary, Secondary, Ghost, Icon)
│   ├── Cards (Price Row, Module Card, Stat Card)
│   ├── Inputs (Text, Number, Search, Slider)
│   ├── Navigation (Bottom Tab Bar, Header, Drawer)
│   ├── Feedback (Toast, Badge, Skeleton, Offline Banner)
│   └── Data Display (Chart Frame, Progress Ring, Sparkline)
├── Screens — Dark Theme
│   ├── 01-Dashboard
│   ├── 02-Learn-Modules
│   ├── 03-Learn-Lesson
│   ├── 04-Learn-Quiz
│   ├── 05-Market
│   ├── 06-Trade
│   ├── 07-Portfolio
│   ├── 08-Wallet-Connect
│   ├── 09-Navigation-Drawer
│   ├── 10-Install-Prompt
│   └── 11-Offline-State
├── Screens — Light Theme
│   └── (same screens with light token overrides)
└── Flows
    ├── Onboarding (first visit → learn → first trade)
    ├── Trade Execution (select token → enter amount → confirm → success)
    └── Wallet Connection (tap connect → select wallet → approve → connected)
```
