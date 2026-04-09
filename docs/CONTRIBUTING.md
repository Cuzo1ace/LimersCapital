# Contributing to Limer's Capital

Welcome! This guide covers everything you need to start contributing.

---

## 1. Development Setup

See [OPERATIONS.md](OPERATIONS.md) for detailed setup instructions. Quick version:

```bash
git clone https://github.com/Cuzo1ace/LimersCapital.git
cd caribcryptomap
npm install
npm run dev
```

Requires Node.js 24.x. Create `.env.local` from the template in OPERATIONS.md.

---

## 2. Code Style

### Language

- **JavaScript** (not TypeScript) — `.js` for utilities, `.jsx` for React components
- We may migrate to TypeScript in the future, but current codebase is pure JS

### React

- Functional components with hooks (no class components)
- Custom hooks prefixed with `use` (e.g., `useWalletBalance`, `useLimerBridge`)
- Props destructured in function signature

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Pages | PascalCase | `LearnPage.jsx`, `TradePage.jsx` |
| Components | PascalCase | `GlowCard.jsx`, `PostTradeInsight.jsx` |
| Data modules | camelCase | `tokenomics.js`, `lessons.js` |
| Utilities | camelCase | `validation.js`, `prices.js` |
| Tests | camelCase + `.test` | `education.test.js` |

### Zustand Store Actions

```javascript
actionName: (params) => {
  const state = get();
  // ... logic using state
  set({ updatedField: newValue });
  // Cross-slice calls
  get().awardXP(amount, 'reason');
  get()._checkBadges();
},
```

- Public actions: `camelCase` (e.g., `executeTrade`, `markLessonRead`)
- Internal actions: prefixed with `_` (e.g., `_checkBadges`, `_generateTeachingMoment`)

### Comments

- Section headers use `// -- Section Name --` format
- JSDoc for exported functions and data structures
- Inline comments for non-obvious logic

---

## 3. Testing Conventions

### Framework

- **Vitest 4** with **jsdom** environment
- **@testing-library/jest-dom** for DOM matchers
- Setup file: `src/test/setup.js`

### Pattern

Tests import data modules directly and test pure logic — no React component rendering currently:

```javascript
import { describe, it, expect } from 'vitest';
import { BADGES } from '../data/badges';

describe('Badges', () => {
  it('should have unique IDs', () => {
    const ids = BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

### Running Tests

```bash
# Run all tests (must pass before PR)
npx vitest run

# Watch mode
npx vitest
```

---

## 4. Adding New Features

### New Data Module

1. Create file in `src/data/` (e.g., `src/data/treasury.js`)
2. Export named constants (e.g., `export const INSURANCE_FUND = { ... }`)
3. Add tests in `src/test/` (e.g., `src/test/treasury.test.js`)

### New Page

1. Create component in `src/pages/` (e.g., `src/pages/NewPage.jsx`)
2. Register route in `src/App.jsx`
3. Add navigation link in `src/components/Header.jsx` and `src/components/MobileNav.jsx`

### New Component

1. Create in `src/components/` (top-level) or a subdirectory for feature groups:
   - `src/components/gamification/` — XP, badges, rewards
   - `src/components/ui/` — Generic UI elements (Tooltip, Modal)
2. Follow existing patterns: Tailwind 4 classes, framer-motion for animations

### New Store State

1. Add field with default value in `useStore.js` (find the relevant section)
2. Add to `partialize` function (line 1253+) if it should persist across sessions
3. Bump `_storeVersion` (currently at line 1258)
4. Zustand handles missing keys gracefully — new fields default to initial values for existing users

### New On-Chain Instruction

1. Add to `anchor/programs/limer/src/lib.rs`
2. Rebuild IDL: `cd anchor && anchor build`
3. Copy updated IDL to `src/solana/idl/limer.json`
4. Add mutation in `src/solana/mutations.js`
5. Add sync logic in `src/solana/bridge.js`

---

## 5. Pull Request Process

### Branch Naming

```
feature/<description>    # New functionality
fix/<description>        # Bug fixes
docs/<description>       # Documentation
refactor/<description>   # Code improvements
test/<description>       # Test additions
```

### PR Requirements

- [ ] `npx vitest run` passes (all existing + new tests)
- [ ] `npx vite build` succeeds with no errors
- [ ] Manual testing completed for affected features
- [ ] PR description explains the change and its purpose

### Survival Lever Classification

If your change relates to the centennial survival model, note which lever it addresses:

- **Lambda** (mortality reduction) — reduces annual failure probability
- **Alpha** (antifragility) — makes the platform stronger under stress
- **Beta** (governance quality) — improves institutional governance

---

## 6. Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streak fee credits for trading discount accumulation
fix: prevent duplicate referral code redemption
docs: add operations runbook and architecture decisions
refactor: extract chain interface from Solana-specific code
test: add treasury allocation validation tests
chore: update dependencies, add GitHub templates
```

---

## 7. Architecture Reference

Key files to understand before contributing:

| File | Lines | Role |
|------|-------|------|
| `src/store/useStore.js` | 1,320 | Central state — all app logic lives here |
| `src/solana/bridge.js` | 217 | Local ↔ on-chain sync |
| `src/data/tokenomics.js` | 82 | Economic model constants |
| `src/data/gamification.js` | ~200 | XP tiers, badge definitions, LP actions |
| `workers/api-proxy.js` | ~300 | Server-side API proxy + quiz validation |

See [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) for why we made these choices.

---

*Questions? Open an issue or reach out to @Cuzo1Ace.*
