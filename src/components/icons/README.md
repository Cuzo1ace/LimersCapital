# Limer's branded icon set

Custom SVG motif icons for Limer's Capital — Caribbean-themed, token-aware, a11y-clean. Replaces the 773 emoji occurrences that were being used as icons.

## Contract (frozen)

Every icon is a React component that renders its paths through `_Icon.jsx`. The wrapper normalizes the props so every icon behaves identically.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `size` | `number \| string` | `24` | Sets both `width` and `height`. |
| `color` | `string` | `'currentColor'` | Drives `stroke`. Leave at default so Tailwind classes like `text-sea` work. |
| `strokeWidth` | `number` | `1.75` | Emil/Lucide-style stroke. `CloseIcon` overrides to `1.5` for small sizes. |
| `title` | `string` | — | Accessible name. If omitted, the SVG is `aria-hidden`. |
| `className` | `string` | — | Forwarded to the root `<svg>`. |
| `viewBox` | `string` | `'0 0 24 24'` | Override for brand motifs with a larger frame. |

Any other prop is spread onto the root `<svg>`.

## Usage

```jsx
import { LimerIcon, TrendUpIcon, PalmIcon } from '@/components/icons';

// Decorative — aria-hidden
<LimerIcon size={20} className="text-sea" />

// Meaningful — gets an accessible name
<TrendUpIcon size={16} title="Gains" className="text-up" />

// Overridable color
<PalmIcon color="var(--color-palm)" size={32} />
```

## Design principles

1. **Currency-of-color is `currentColor`.** Icons inherit text color so token classes (`text-sea`, `text-coral`, `text-down`) drive them. This keeps theme switching free.
2. **One motif, one file.** No icon sprite; Vite tree-shakes unused icons.
3. **Stroke over fill.** Default `strokeWidth={1.75}`, `strokeLinecap="round"`, `strokeLinejoin="round"`. Fill is reserved for signature marks (Palm, Limer, Insight bulb filament) or optional state flags (e.g. `<StarIcon filled />`).
4. **Caribbean motifs** on brand-critical icons — `PalmIcon`, `LimerIcon`, `LearnIcon` (palm-frond corner), `InsightIcon` (palm-frond filament).

## Icon catalog

| Component | Replaces | Motif notes |
|---|---|---|
| `ChartIcon` | 📊 | Bar+line combo. |
| `CheckIcon` | ✓ | Crisp 1.75 stroke. |
| `LearnIcon` | 📚 | Stacked pages with palm-frond corner. |
| `BoltIcon` | ⚡ | Sun-yellow when tinted. |
| `TrendUpIcon` | 📈 | Sea-green when tinted. |
| `PalmIcon` | 🌴 | **Signature brand motif.** |
| `LimerIcon` | 🍋 | **Signature brand motif** — lime wedge. |
| `CloseIcon` | ✕ | `strokeWidth={1.5}` for small sizes. |
| `TrophyIcon` | 🏆 | Gold when tinted. |
| `AlertIcon` | ⚠ | Coral when tinted. |
| `TickerIcon` | 💹 | Chart-with-arrow inside a frame. |
| `InsightIcon` | 💡 | Bulb with palm filament. |
| `LockIcon` | 🔒 | Privacy pillar. |
| `ExchangeIcon` | 🏛 | Columned building for TTSE. |
| `StreakIcon` | 🔥 | Flame (sun-tinted). |
| `LinkIcon` | 🔗 | Chain link. |
| `StarIcon` | ⭐ | Outline; pass `filled` for solid. |
| `WalletIcon` | 💰 | Coin-stack. |
| `ShieldIcon` | 🛡 | Privacy pillar pair. |
| `TargetIcon` | 🎯 | Concentric Caribbean rings. |
| `SignalIcon` | — | Signal pillar — broadcast waves. |
| `ConnectionIcon` | — | Connection pillar — 3-node network. |

## Changing the contract

The props contract is frozen as a published API. Any change requires:

1. A codemod for every call-site (`rg "<(Chart\|Check\|Palm\|…)Icon"`), and
2. A matching update to the smoke test (`__tests__/Icon.test.jsx`).

Do not hand-edit call sites if the contract evolves — use a codemod.
