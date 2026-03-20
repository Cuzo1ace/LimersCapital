import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTier, XP_VALUES } from '../data/gamification';
import { BADGES } from '../data/badges';
import { MODULES } from '../data/modules';
import { getLPMultiplier } from '../data/lp';

const INITIAL_USD = 100000;
const INITIAL_TTD = 679000;
const FEE_RATE = 0.003; // 0.3% trading fee

const useStore = create(
  persist(
    (set, get) => ({
      // ── Trading ─────────────────────────────────────────────
      balanceUSD: INITIAL_USD,
      balanceTTD: INITIAL_TTD,
      holdings: [],
      trades: [],

      executeTrade: (side, symbol, qty, price, currency = 'USD', market = 'solana') => {
        if (!qty || qty <= 0 || !price || price <= 0 || !symbol) return { error: 'Invalid quantity or price' };
        if (!Number.isFinite(qty) || !Number.isFinite(price)) return { error: 'Quantity and price must be valid numbers' };
        const total = qty * price;
        const state = get();
        const balKey = currency === 'TTD' ? 'balanceTTD' : 'balanceUSD';
        const trade = {
          id: Date.now().toString(36), side, symbol, qty, price, total, currency, market,
          timestamp: new Date().toISOString(),
        };
        const holdKey = `${market}:${symbol}`;

        if (side === 'buy') {
          if (total > state[balKey]) return { error: `Insufficient ${currency} balance` };
          const existing = state.holdings.find(h => `${h.market}:${h.symbol}` === holdKey);
          let holdings;
          if (existing) {
            const newQty = existing.qty + qty;
            const newAvg = (existing.avgPrice * existing.qty + price * qty) / newQty;
            holdings = state.holdings.map(h =>
              `${h.market}:${h.symbol}` === holdKey ? { ...h, qty: newQty, avgPrice: newAvg } : h
            );
          } else {
            holdings = [...state.holdings, { symbol, qty, avgPrice: price, currency, market, timestamp: trade.timestamp }];
          }
          set({ [balKey]: state[balKey] - total, holdings, trades: [trade, ...state.trades].slice(0, 100) });
        } else {
          const existing = state.holdings.find(h => `${h.market}:${h.symbol}` === holdKey);
          if (!existing || existing.qty < qty) return { error: `No ${symbol} to sell` };
          const newQty = existing.qty - qty;
          const holdings = newQty > 0.0001
            ? state.holdings.map(h => `${h.market}:${h.symbol}` === holdKey ? { ...h, qty: newQty } : h)
            : state.holdings.filter(h => `${h.market}:${h.symbol}` !== holdKey);
          set({ [balKey]: state[balKey] + total, holdings, trades: [trade, ...state.trades].slice(0, 100) });
        }

        // Track simulated revenue (0.3% fee split 50/50)
        const fee = total * FEE_RATE;
        const rev = get().simulatedRevenue;
        set({
          simulatedRevenue: {
            ...rev,
            totalPlatformRevenue: rev.totalPlatformRevenue + fee,
            communityPool: rev.communityPool + fee / 2,
            platformPool: rev.platformPool + fee / 2,
            userTrades: rev.userTrades + 1,
            feeRevenue: rev.feeRevenue + fee,
          },
        });

        // Trade milestones (XP)
        const newTradeCount = get().trades.length;
        if (newTradeCount === 1) get().awardXP(XP_VALUES.firstTrade, 'First trade!');
        else if (newTradeCount === 10) get().awardXP(XP_VALUES.tenTrades, '10 trades milestone!');
        else if (newTradeCount === 50) get().awardXP(XP_VALUES.fiftyTrades, '50 trades milestone!');

        // LP for trading
        get().awardLP(10, 'Trade executed', 'trade');
        const volumeLP = Math.floor(total / 100);
        if (volumeLP > 0) get().awardLP(volumeLP, `$${total.toFixed(0)} volume`, 'volume');

        get()._checkBadges();
        return { success: true };
      },

      resetPortfolio: () => set({ balanceUSD: INITIAL_USD, balanceTTD: INITIAL_TTD, holdings: [], trades: [] }),

      // ── Wallet ────────────────────────────────────────────────
      walletAddress: null,
      walletConnected: false,

      connectWallet: (address) => {
        set({ walletAddress: address, walletConnected: true });
        const state = get();
        if (!state.earnedBadges.includes('wallet_connected')) {
          get().awardXP(25, 'Wallet connected!');
        }
        get().awardLP(50, 'Wallet connected', 'wallet');
      },

      disconnectWallet: () => set({ walletAddress: null, walletConnected: false }),

      // ── Network ─────────────────────────────────────────────
      cluster: 'devnet',
      setCluster: (cluster) => set({ cluster }),

      // ── Navigation ──────────────────────────────────────────
      activeTab: 'regulation',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ── Gamification ────────────────────────────────────────
      xp: 0,
      lessonsRead: {},
      quizResults: {},
      quizStreak: 0,
      earnedBadges: [],
      unlockedFeatures: [],
      currentStreak: 0,
      lastLoginDate: null,
      longestStreak: 0,
      viewedGlossaryTerms: [],
      modulesCompleted: [],
      pendingToasts: [],

      awardXP: (amount, reason) => {
        const state = get();
        const newXP = state.xp + amount;
        const oldTier = getTier(state.xp);
        const newTier = getTier(newXP);
        const toasts = [{ id: Date.now().toString(36), type: 'xp', title: `+${amount} XP`, message: reason }];

        if (newTier.level > oldTier.level) {
          toasts.push({ id: Date.now().toString(36) + 'lvl', type: 'level', title: `Level Up!`, message: `You are now a ${newTier.name} ${newTier.icon}` });
          // Update LP multiplier on tier up
          set({ lpMultiplier: getLPMultiplier(newTier.level) });
        }

        set({
          xp: newXP,
          pendingToasts: [...state.pendingToasts, ...toasts],
        });
      },

      markLessonRead: (lessonId) => {
        const state = get();
        if (state.lessonsRead[lessonId]) return;
        const newRead = { ...state.lessonsRead, [lessonId]: true };
        set({ lessonsRead: newRead });
        get().awardXP(XP_VALUES.lessonRead, `Lesson completed!`);
        get().awardLP(5, 'Lesson completed', 'lesson');
        get()._checkModuleComplete();
        get()._checkBadges();
      },

      submitQuizResult: (quizId, score, total) => {
        const state = get();
        const passed = score / total >= 0.7;
        const perfect = score === total;
        const result = { score, total, passed, perfect, timestamp: new Date().toISOString() };

        const newResults = { ...state.quizResults, [quizId]: result };
        let newStreak = perfect ? state.quizStreak + 1 : 0;

        set({ quizResults: newResults, quizStreak: newStreak });

        if (passed) {
          get().awardXP(perfect ? XP_VALUES.quizPerfect : XP_VALUES.quizPass, perfect ? 'Perfect quiz score!' : 'Quiz passed!');
          get().awardLP(perfect ? 25 : 15, perfect ? 'Perfect quiz!' : 'Quiz passed', 'quiz');
        }

        if (newStreak >= 3 && !state.unlockedFeatures.includes('quiz_streak_bonus')) {
          set({ balanceUSD: get().balanceUSD + 10000, unlockedFeatures: [...get().unlockedFeatures, 'quiz_streak_bonus'] });
          set({ pendingToasts: [...get().pendingToasts, { id: 'qsb', type: 'unlock', title: 'Bonus $10K!', message: '3 perfect quizzes in a row!' }] });
        }

        get()._checkModuleComplete();
        get()._checkBadges();
      },

      _checkModuleComplete: () => {
        const state = get();
        MODULES.forEach(mod => {
          if (state.modulesCompleted.includes(mod.id)) return;
          const allRead = mod.lessons.every(l => state.lessonsRead[l]);
          const quizPassed = state.quizResults[mod.quizId]?.passed;
          if (allRead && quizPassed) {
            const newCompleted = [...state.modulesCompleted, mod.id];
            const newUnlocks = [...new Set([...state.unlockedFeatures, ...mod.unlocks])];
            set({ modulesCompleted: newCompleted, unlockedFeatures: newUnlocks });
            get().awardXP(XP_VALUES.moduleComplete, `${mod.title} module complete!`);
            get().awardLP(50, `${mod.title} module complete!`, 'module');
            mod.unlocks.forEach(u => {
              set({ pendingToasts: [...get().pendingToasts, { id: 'u:' + u, type: 'unlock', title: 'Feature Unlocked!', message: mod.unlockLabel }] });
            });
          }
        });
      },

      _checkBadges: () => {
        const state = get();
        BADGES.forEach(badge => {
          if (state.earnedBadges.includes(badge.id)) return;
          if (badge.check(state)) {
            set({
              earnedBadges: [...get().earnedBadges, badge.id],
              pendingToasts: [...get().pendingToasts, { id: 'b:' + badge.id, type: 'badge', title: `${badge.icon} ${badge.title}`, message: badge.desc }],
            });
          }
        });
      },

      checkDailyStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        if (state.lastLoginDate === today) return;

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = state.lastLoginDate === yesterday;
        const newStreak = isConsecutive ? state.currentStreak + 1 : 1;
        const newLongest = Math.max(newStreak, state.longestStreak);

        set({ currentStreak: newStreak, lastLoginDate: today, longestStreak: newLongest });
        get().awardXP(XP_VALUES.dailyStreak, `Day ${newStreak} streak!`);
        get().awardLP(3 * newStreak, `Day ${newStreak} streak!`, 'streak');
        get()._checkBadges();
      },

      markGlossaryViewed: (term) => {
        const state = get();
        if (state.viewedGlossaryTerms.includes(term)) return;
        set({ viewedGlossaryTerms: [...state.viewedGlossaryTerms, term] });
        get().awardXP(XP_VALUES.glossaryTerm, `Learned: ${term}`);
        get().awardLP(1, `Glossary: ${term}`, 'glossary');
        get()._checkBadges();
      },

      dismissToast: (toastId) => {
        set({ pendingToasts: get().pendingToasts.filter(t => t.id !== toastId) });
      },

      resetProgress: () => set({
        xp: 0, lessonsRead: {}, quizResults: {}, quizStreak: 0,
        earnedBadges: [], unlockedFeatures: [], currentStreak: 0,
        lastLoginDate: null, longestStreak: 0, viewedGlossaryTerms: [],
        modulesCompleted: [], pendingToasts: [],
        limerPoints: 0, lpHistory: [], lpMultiplier: 1.0,
      }),

      // ── Limer Points (LP) ──────────────────────────────────
      limerPoints: 0,
      lpHistory: [],
      lpMultiplier: 1.0,
      referralCode: null,
      lpReferrals: [],
      _lpMigrated: false,

      awardLP: (baseAmount, reason, action) => {
        const state = get();
        const multiplied = ['trade', 'volume', 'lesson', 'quiz', 'module', 'streak'].includes(action);
        const amount = multiplied ? Math.floor(baseAmount * state.lpMultiplier) : baseAmount;
        const entry = { amount, reason, action, timestamp: new Date().toISOString() };

        set({
          limerPoints: state.limerPoints + amount,
          lpHistory: [entry, ...state.lpHistory].slice(0, 500),
          pendingToasts: [...state.pendingToasts, { id: 'lp:' + Date.now().toString(36), type: 'lp', title: `+${amount} LP`, message: reason }],
        });
        get()._checkBadges();
      },

      generateReferralCode: () => {
        const state = get();
        if (state.referralCode) return state.referralCode;
        const code = state.walletAddress
          ? 'LIMER-' + state.walletAddress.slice(0, 6).toUpperCase()
          : 'LIMER-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        set({ referralCode: code });
        return code;
      },

      applyReferral: (code) => {
        const state = get();
        if (state.lpReferrals.some(r => r.code === code)) return;
        set({ lpReferrals: [...state.lpReferrals, { code, timestamp: new Date().toISOString() }] });
        get().awardLP(200, 'Referral bonus', 'referral');
      },

      _migrateToLP: () => {
        const state = get();
        if (state._lpMigrated) return;
        let retroLP = 0;
        retroLP += Object.keys(state.lessonsRead).length * 5;
        retroLP += Object.values(state.quizResults).filter(r => r.passed).length * 15;
        retroLP += Object.values(state.quizResults).filter(r => r.perfect).length * 10;
        retroLP += state.modulesCompleted.length * 50;
        retroLP += state.trades.length * 10;
        retroLP += state.walletConnected ? 50 : 0;
        retroLP += state.viewedGlossaryTerms.length * 1;
        set({ _lpMigrated: true });
        if (retroLP > 0) {
          set({
            limerPoints: state.limerPoints + retroLP,
            lpHistory: [{ amount: retroLP, reason: 'Retroactive LP for past activity', action: 'migration', timestamp: new Date().toISOString() }, ...state.lpHistory],
          });
        }
      },

      // ── Simulated Revenue ──────────────────────────────────
      simulatedRevenue: {
        totalPlatformRevenue: 0,
        communityPool: 0,
        platformPool: 0,
        userTrades: 0,
        feeRevenue: 0,
      },

      // ── Watchlist ──────────────────────────────────────────
      watchlist: [],
      toggleWatchlist: (symbol) => set(s => ({
        watchlist: s.watchlist.includes(symbol)
          ? s.watchlist.filter(x => x !== symbol)
          : [...s.watchlist, symbol],
      })),

      // ── Listing Applications ───────────────────────────────
      listingApplications: [],

      submitListingApplication: (data) => {
        const app = { ...data, timestamp: new Date().toISOString(), status: 'submitted' };
        set({ listingApplications: [...get().listingApplications, app] });
        get().awardLP(100, 'Listing application submitted', 'listing');
      },
    }),
    {
      name: 'caribcrypto-storage',
      partialize: (state) => ({
        balanceUSD: state.balanceUSD, balanceTTD: state.balanceTTD,
        holdings: state.holdings, trades: state.trades,
        walletAddress: state.walletAddress, walletConnected: state.walletConnected,
        cluster: state.cluster,
        xp: state.xp, lessonsRead: state.lessonsRead,
        quizResults: state.quizResults, quizStreak: state.quizStreak,
        earnedBadges: state.earnedBadges, unlockedFeatures: state.unlockedFeatures,
        currentStreak: state.currentStreak, lastLoginDate: state.lastLoginDate,
        longestStreak: state.longestStreak, viewedGlossaryTerms: state.viewedGlossaryTerms,
        modulesCompleted: state.modulesCompleted,
        // Phase 2
        limerPoints: state.limerPoints, lpHistory: state.lpHistory,
        lpMultiplier: state.lpMultiplier, referralCode: state.referralCode,
        lpReferrals: state.lpReferrals, _lpMigrated: state._lpMigrated,
        simulatedRevenue: state.simulatedRevenue,
        listingApplications: state.listingApplications,
        watchlist: state.watchlist,
      }),
    }
  )
);

export default useStore;
