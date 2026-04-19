# @limers/gamification

> A production-tested reward loop for Solana retail apps — XP, tiers, badges, LP multipliers, and leaderboard helpers extracted from [Limer's Capital](https://limerscapital.com). Pure functions, zero framework assumptions, no blockchain calls.

## Why

Every Solana retail app rebuilds this. The flagship that this was extracted from ships 10 tier levels (Sand Walker → Sovereign), 40+ badges across four categories, an LP (loyalty-points) layer with a 1.0×–5.0× tier multiplier, and a deterministic leaderboard for demo builds. It's been running in production for 12 months across dashboard, learn, trade, portfolio, competition, and points surfaces.

## Install

```bash
npm install @limers/gamification
```

## Five-minute integration

```js
import {
  TIERS, getTier, getNextTier,
  XP_VALUES,
  BADGES,
  getLPMultiplier, LP_ACTIONS, generateLeaderboard,
  FEATURE_KEYS,
} from '@limers/gamification';

// 1. Award XP on user actions
function onLessonRead(state) {
  state.xp += XP_VALUES.lessonRead; // 50 XP
}

// 2. Derive the user's current tier
const tier = getTier(state.xp);            // { level, xp, name, color, icon }
const next = getNextTier(state.xp);        // null at the top tier

// 3. Apply the tier's LP multiplier to any LP reward
function onTradeExecuted(state) {
  const base = 10;
  const boosted = base * getLPMultiplier(tier.level); // 10..50 depending on tier
  state.lp += boosted;
}

// 4. Re-check badge eligibility after any state change
const snapshot = {
  lessonsRead: state.lessonsRead,
  trades: state.trades,
  holdings: state.holdings,
  limerPoints: state.lp,
  // ...see schema.js for the full StateSnapshot shape
};
const newlyEarned = BADGES
  .filter((b) => !state.earnedBadges.has(b.id) && b.check(snapshot))
  .map((b) => b.id);

// 5. Fake a leaderboard for your demo / testnet build
const board = generateLeaderboard(state.lp, 'you.sol');
// → [{ name, lp, isUser, rank }, ...] — deterministic 51-entry list
```

## Feature-unlock keys

Modules from `@limers/curriculum` declare `unlocks: string[]` using the keys exported from `FEATURE_KEYS`. Gate features in your app by checking a module's completion against the key:

```js
import { FEATURE_KEYS } from '@limers/gamification';

const canTradeTTSE = state.unlockedFeatures.includes(FEATURE_KEYS.ttse_trading);
```

## State contract

The default badge `check(state)` predicates expect a small, documented shape: `{ lessonsRead, trades, holdings, quizResults, limerPoints, ... }`. The full contract lives in [`src/schema.js`](src/schema.js). Adapt your store to satisfy it (typically 10–20 lines of selectors) and every bundled badge works out of the box.

Any badge you don't want? Filter it:

```js
const myBadges = BADGES.filter((b) => b.cat !== 'lp'); // e.g. skip LP-academy badges
```

## Pairs with

- [`@limers/curriculum`](../limers-curriculum) — the content side of the loop. Modules carry `unlocks` keys that map to this package's `FEATURE_KEYS`.

## Versioning

The `TIERS` array and the `getTier`/`getNextTier` API shape are stable under semver. Individual badge predicates may evolve inside a minor release; pin exactly if that matters.

## License

Apache-2.0 · © Limer's Capital
