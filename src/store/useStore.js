import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTier, XP_VALUES } from '../data/gamification';
import { BADGES } from '../data/badges';
import { MODULES } from '../data/modules';
import { getLPMultiplier } from '../data/lp';
import { pickInsight } from '../data/tradeInsights';
import { checkChallenges, PRACTICE_CHALLENGES } from '../data/practiceChallenges';
import { track, identify, analyticsReset } from '../analytics/track';
import { upsertUser, syncUserStats, recordReferral, logActivity } from '../api/supabase';

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
        // Referral prompt at trade milestones
        if ([1, 5, 25].includes(newTradeCount) && !get().pendingReferralPrompt) {
          set({ pendingReferralPrompt: { trigger: newTradeCount === 1 ? 'First trade!' : `${newTradeCount} trades!`, timestamp: Date.now() } });
        }

        // LP for trading
        get().awardLP(10, 'Trade executed', 'trade');
        const volumeLP = Math.floor(total / 100);
        if (volumeLP > 0) get().awardLP(volumeLP, `$${total.toFixed(0)} volume`, 'volume');
        // Bonus XP for TTSE stock trades (Caribbean market engagement)
        if (market === 'ttse') {
          get().awardXP(XP_VALUES.ttseTrade, 'TTSE stock trade!');
          get().awardLP(10, 'TTSE trade bonus', 'ttse_trade');
        }

        get()._checkBadges();
        // Competition: record trade (buy = no PnL yet, sell = realize gain/loss)
        const tradePnlForInsight = (() => {
          if (side === 'sell') {
            const holding = state.holdings.find(h => `${h.market}:${h.symbol}` === holdKey);
            const avgCost = holding ? holding.avgPrice : price;
            const pnl = (price - avgCost) * qty;
            get()._recordCompetitionTrade(pnl);
            return pnl;
          }
          return undefined;
        })();
        // Post-trade teaching moment
        get()._generateTeachingMoment({ side, symbol, qty, price, total, market, pnl: tradePnlForInsight });
        get()._checkPracticeChallenges();
        track('trade_executed', { side, symbol, market, total: Math.round(total) });
        get()._syncToSupabase();
        // Log to activity feed
        const wa = get().walletAddress;
        if (wa) logActivity({ walletAddress: wa, eventType: 'trade', icon: side === 'buy' ? '💹' : '📉', description: `Someone just ${side === 'buy' ? 'bought' : 'sold'} ${symbol}` });
        return { success: true };
      },

      resetPortfolio: () => set({ balanceUSD: INITIAL_USD, balanceTTD: INITIAL_TTD, holdings: [], trades: [], perpPositions: [], perpTradeCount: 0, perpTotalPnl: 0 }),

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

        // Apply any stashed referral code (Sybil guard: wallet is now verified)
        const pending = get().pendingReferralCode;
        if (pending && !get().lpReferrals.some(r => r.code === pending)) {
          set({ lpReferrals: [...get().lpReferrals, { code: pending, timestamp: new Date().toISOString() }], pendingReferralCode: null });
          get().awardLP(200, 'Referral bonus', 'referral');
        }

        const s = get();
        identify(address, { tier: getTier(s.xp).name, xp: s.xp, limerPoints: s.limerPoints });
        track('wallet_connected', { address: address.slice(0, 8) + '…' });

        // ── Supabase sync (fire-and-forget) ──
        const refCode = s.referralCode || 'LIMER-' + address.slice(0, 8).toUpperCase();
        upsertUser({
          walletAddress: address,
          referralCode: refCode,
          xp: s.xp,
          limerPoints: s.limerPoints,
          tier: getTier(s.xp).name,
          currentStreak: s.currentStreak,
          longestStreak: s.longestStreak,
          tradesCount: s.trades.length,
          lessonsCount: Object.keys(s.lessonsRead).length,
        });
        // If a referral was applied, record the relationship
        if (pending) {
          recordReferral(address, pending);
        }
      },

      disconnectWallet: () => {
        track('wallet_disconnected');
        analyticsReset();
        set({ walletAddress: null, walletConnected: false });
      },

      // ── Supabase Sync ────────────────────────────────────────
      // Debounced sync — call after any state-changing event.
      // Fire-and-forget: localStorage remains the source of truth.
      _supabaseSyncTimer: null,
      _syncToSupabase: () => {
        const state = get();
        if (!state.walletAddress) return;
        clearTimeout(state._supabaseSyncTimer);
        const timer = setTimeout(() => {
          const s = get();
          syncUserStats(s.walletAddress, {
            xp: s.xp,
            limerPoints: s.limerPoints,
            tier: getTier(s.xp).name,
            currentStreak: s.currentStreak,
            longestStreak: s.longestStreak,
            tradesCount: s.trades.length,
            lessonsCount: Object.keys(s.lessonsRead).length,
          });
        }, 2000); // 2s debounce
        set({ _supabaseSyncTimer: timer });
      },

      // ── Network ─────────────────────────────────────────────
      cluster: 'devnet',
      setCluster: (cluster) => set({ cluster }),
      selectedChain: 'solana',
      setSelectedChain: (chainId) => set({ selectedChain: chainId }),

      // ── Navigation ──────────────────────────────────────────
      activeTab: 'dashboard',
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

      // ── Teaching Moments ───────────────────────────────────
      pendingTeachingMoment: null,
      teachingMomentsViewed: [],

      // Daily Knowledge
      viewedDailyKnowledge: [],
      lastDailyKnowledgeDate: null,

      // Micro-Lessons
      viewedMicroLessons: [],

      // Trading Journal
      tradeJournal: {},
      journalPromptEnabled: true,

      // Practice Challenges
      completedPracticeChallenges: [],
      activePracticeChallenge: null,

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
        get()._syncToSupabase();
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
        track('lesson_completed', { lessonId, totalLessons: Object.keys(newRead).length });
        const wa2 = get().walletAddress;
        if (wa2) logActivity({ walletAddress: wa2, eventType: 'lesson', icon: '📚', description: `Someone just completed a lesson` });
      },

      // Score and pass/fail come from the server response (answers validated server-side).
      // The `serverResult` parameter is passed from the QuizPanel after /game/quiz-submit returns.
      submitQuizResult: (quizId, score, total, serverResult) => {
        const state = get();
        const passed = serverResult?.passed ?? (score / total >= 0.7);
        const perfect = serverResult?.perfect ?? (score === total);
        const result = { score, total, passed, perfect, timestamp: new Date().toISOString() };

        const newResults = { ...state.quizResults, [quizId]: result };
        let newStreak = perfect ? state.quizStreak + 1 : 0;

        set({ quizResults: newResults, quizStreak: newStreak });

        if (passed) {
          get().awardXP(perfect ? XP_VALUES.quizPerfect : XP_VALUES.quizPass, perfect ? 'Perfect quiz score!' : 'Quiz passed!');
          get().awardLP(perfect ? 25 : 15, perfect ? 'Perfect quiz!' : 'Quiz passed', 'quiz');

          // Auto-mark all lessons in this module as read.
          // If you passed the quiz, you've demonstrated mastery — lessons should count.
          const mod = MODULES.find(m => m.quizId === quizId);
          if (mod) {
            const currentRead = get().lessonsRead;
            const newRead = { ...currentRead };
            let newlyRead = 0;
            mod.lessons.forEach(lessonId => {
              if (!newRead[lessonId]) {
                newRead[lessonId] = true;
                newlyRead++;
              }
            });
            if (newlyRead > 0) {
              set({ lessonsRead: newRead });
            }
          }
        }

        if (newStreak >= 3 && !state.unlockedFeatures.includes('quiz_streak_bonus')) {
          set({ balanceUSD: get().balanceUSD + 10000, unlockedFeatures: [...get().unlockedFeatures, 'quiz_streak_bonus'] });
          set({ pendingToasts: [...get().pendingToasts, { id: 'qsb', type: 'unlock', title: 'Bonus $10K!', message: '3 perfect quizzes in a row!' }] });
        }

        get()._checkModuleComplete();
        get()._checkBadges();
        track('quiz_submitted', { quizId, score, total, passed, perfect });
      },

      _checkModuleComplete: () => {
        const state = get();
        MODULES.forEach(mod => {
          if (state.modulesCompleted.includes(mod.id)) return;
          // Prerequisite check: module cannot complete until prereq is done
          if (mod.prereq && !state.modulesCompleted.includes(mod.prereq)) return;
          const allRead = mod.lessons.every(l => state.lessonsRead[l]);
          const quizPassed = state.quizResults[mod.quizId]?.passed;
          if (allRead && quizPassed) {
            const newCompleted = [...state.modulesCompleted, mod.id];
            const newUnlocks = [...new Set([...state.unlockedFeatures, ...mod.unlocks])];
            set({ modulesCompleted: newCompleted, unlockedFeatures: newUnlocks });
            get().awardXP(XP_VALUES.moduleComplete, `${mod.title} module complete!`);
            get().awardLP(50, `${mod.title} module complete!`, 'module');
            // Referral prompt on module completion
            if (!get().pendingReferralPrompt) {
              set({ pendingReferralPrompt: { trigger: `${mod.title} complete!`, timestamp: Date.now() } });
            }
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
            track('badge_earned', { badgeId: badge.id, badgeTitle: badge.title, category: badge.cat });
          }
        });
      },

      // ── Teaching Moment Actions ────────────────────────────
      _generateTeachingMoment: (trade) => {
        const state = get();
        const insight = pickInsight(trade, state);
        if (insight) {
          set({ pendingTeachingMoment: insight });
        }
      },

      viewTeachingMoment: (insightId) => {
        const state = get();
        if (state.teachingMomentsViewed.includes(insightId)) return;
        set({ teachingMomentsViewed: [...state.teachingMomentsViewed, insightId] });
        get().awardXP(5, 'Trade insight viewed');
        get().awardLP(2, 'Trade insight', 'learning');
        get()._checkBadges();
      },

      dismissTeachingMoment: () => set({ pendingTeachingMoment: null }),

      viewDailyKnowledge: (knowledgeId, dateStr) => {
        const state = get();
        if (state.lastDailyKnowledgeDate === dateStr) return;
        const viewed = state.viewedDailyKnowledge.includes(knowledgeId)
          ? state.viewedDailyKnowledge
          : [...state.viewedDailyKnowledge, knowledgeId];
        set({ viewedDailyKnowledge: viewed, lastDailyKnowledgeDate: dateStr });
        get().awardXP(5, 'Daily knowledge viewed');
        get().awardLP(2, 'Daily knowledge', 'learning');
        get()._checkBadges();
      },

      viewMicroLesson: (conceptSlug) => {
        const state = get();
        if (state.viewedMicroLessons.includes(conceptSlug)) return;
        set({ viewedMicroLessons: [...state.viewedMicroLessons, conceptSlug] });
        get().awardXP(5, 'Micro-lesson learned');
        get().awardLP(1, 'Micro-lesson', 'learning');
        get()._checkBadges();
      },

      addJournalEntry: (tradeId, { strategy, emotion, reason }) => {
        const state = get();
        const isFirst = Object.keys(state.tradeJournal).length === 0;
        set({
          tradeJournal: {
            ...state.tradeJournal,
            [tradeId]: { strategy, emotion, reason, timestamp: new Date().toISOString() },
          },
        });
        get().awardXP(isFirst ? 10 : 5, isFirst ? 'First journal entry!' : 'Journal entry');
        get().awardLP(3, 'Trade journal', 'learning');
        get()._checkBadges();
      },

      toggleJournalPrompt: () => set(s => ({ journalPromptEnabled: !s.journalPromptEnabled })),

      setActivePracticeChallenge: (id) => set({ activePracticeChallenge: id }),

      _checkPracticeChallenges: () => {
        const state = get();
        const newlyCompleted = checkChallenges(state);
        if (newlyCompleted.length === 0) return;
        const updated = [...state.completedPracticeChallenges, ...newlyCompleted];
        set({ completedPracticeChallenges: updated });
        for (const id of newlyCompleted) {
          const ch = PRACTICE_CHALLENGES.find(c => c.id === id);
          if (ch) {
            get().awardXP(ch.xpReward, `Challenge: ${ch.title}`);
            get().awardLP(ch.lpReward, `Challenge: ${ch.title}`, 'challenge');
          }
        }
        // Clear active challenge if it was just completed
        if (newlyCompleted.includes(state.activePracticeChallenge)) {
          set({ activePracticeChallenge: null });
        }
        get()._checkBadges();
      },

      // ── Streak Fee Credits ─────────────────────────────────
      streakFeeCredits: 0,

      // ── Referral Prompts ────────────────────────────────────
      pendingReferralPrompt: null,
      dismissReferralPrompt: () => set({ pendingReferralPrompt: null }),

      // ── Premium Conversion Tracking ─────────────────────────
      premiumConversionEvents: [],
      trackPremiumConversion: (event) => {
        const entry = { event, timestamp: new Date().toISOString() };
        set(s => ({ premiumConversionEvents: [...s.premiumConversionEvents, entry].slice(0, 200) }));
      },

      // ── Streak Shields ─────────────────────────────────────
      streakShields: 1,
      lastShieldRefill: null,

      useStreakShield: () => {
        const state = get();
        if (state.streakShields <= 0) return false;
        set({ streakShields: state.streakShields - 1 });
        return true;
      },

      checkDailyStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        if (state.lastLoginDate === today) return;

        // Weekly shield refill (every 7 days)
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        if (!state.lastShieldRefill || state.lastShieldRefill <= weekAgo) {
          set({ streakShields: Math.min(state.streakShields + 1, 2), lastShieldRefill: today });
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = state.lastLoginDate === yesterday;

        let newStreak;
        if (isConsecutive) {
          newStreak = state.currentStreak + 1;
        } else if (!isConsecutive && state.streakShields > 0 && state.currentStreak > 0) {
          // Auto-apply shield silently to protect streak
          newStreak = state.currentStreak;
          set({ streakShields: get().streakShields - 1 });
          set({ pendingToasts: [...get().pendingToasts, {
            id: 'shield:' + Date.now().toString(36),
            type: 'xp',
            title: '🛡️ Streak Shield Used!',
            message: `Your ${state.currentStreak}-day streak is protected`,
          }]});
        } else {
          newStreak = 1;
        }

        const newLongest = Math.max(newStreak, state.longestStreak);
        set({ currentStreak: newStreak, lastLoginDate: today, longestStreak: newLongest });
        get().awardXP(XP_VALUES.dailyStreak, `Day ${newStreak} streak!`);
        get().awardLP(3 * newStreak, `Day ${newStreak} streak!`, 'streak');
        // Streak fee credits — accumulate toward trading fee discounts at $LIMER launch
        const creditAmount = Math.min(newStreak, 30);
        set({ streakFeeCredits: get().streakFeeCredits + creditAmount });
        // Referral prompt at 7-day streak milestone
        if (newStreak === 7 && !get().pendingReferralPrompt) {
          set({ pendingReferralPrompt: { trigger: '7-day streak!', timestamp: Date.now() } });
        }
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
        lpSimPositions: [], agentSqueezeUses: 0,
        visitedLPArmy: false, viewedFlywheel: false,
        hasSeenLearnHero: false, experienceLevel: null, eli5Mode: false,
      }),

      // ── Limer Points (LP) ──────────────────────────────────
      limerPoints: 0,
      lpHistory: [],
      lpMultiplier: 1.0,
      referralCode: null,
      lpReferrals: [],
      _lpMigrated: false,
      pendingReferralCode: null, // Sybil guard: hold code until wallet connects

      awardLP: (baseAmount, reason, action) => {
        const state = get();
        const multiplied = ['trade', 'volume', 'lesson', 'quiz', 'module', 'streak', 'lp_position', 'squeeze'].includes(action);
        const amount = multiplied ? Math.floor(baseAmount * state.lpMultiplier) : baseAmount;
        const entry = { amount, reason, action, timestamp: new Date().toISOString() };

        set({
          limerPoints: state.limerPoints + amount,
          lpHistory: [entry, ...state.lpHistory].slice(0, 500),
          pendingToasts: [...state.pendingToasts, { id: 'lp:' + Date.now().toString(36), type: 'lp', title: `+${amount} LP`, message: reason }],
        });
        get()._checkBadges();
        get()._syncToSupabase();
      },

      generateReferralCode: () => {
        const state = get();
        if (state.referralCode) return state.referralCode;
        // Sybil guard: wallet MUST be connected to generate a referral code.
        // Deterministic code derived from wallet address — no random codes.
        if (!state.walletConnected || !state.walletAddress) return null;
        const code = 'LIMER-' + state.walletAddress.slice(0, 8).toUpperCase();
        set({ referralCode: code });
        return code;
      },

      applyReferral: (code) => {
        const state = get();
        // Deduplicate — same code cannot be applied twice
        if (state.lpReferrals.some(r => r.code === code)) return;

        // Sybil guard: wallet must be connected to earn referral LP.
        // If not connected yet, stash the code and award when wallet connects.
        if (!state.walletConnected) {
          set({ pendingReferralCode: code });
          set({ pendingToasts: [...get().pendingToasts, {
            id: 'ref:pending:' + Date.now().toString(36),
            type: 'xp',
            title: '🔗 Connect Wallet to Claim',
            message: 'Connect your Solana wallet to redeem your referral bonus',
          }]});
          return;
        }

        set({ lpReferrals: [...state.lpReferrals, { code, timestamp: new Date().toISOString() }] });
        get().awardLP(200, 'Referral bonus', 'referral');
      },

      // One-time sync: backfill lessonsRead for users who passed quizzes
      // without clicking "Mark as Complete" on individual lessons.
      _syncLessonsFromQuizzes: () => {
        const state = get();
        if (state._lessonsSynced) return;
        const currentRead = { ...state.lessonsRead };
        let changed = false;
        MODULES.forEach(mod => {
          const quizPassed = state.quizResults[mod.quizId]?.passed;
          if (quizPassed) {
            mod.lessons.forEach(lessonId => {
              if (!currentRead[lessonId]) {
                currentRead[lessonId] = true;
                changed = true;
              }
            });
          }
        });
        set({ _lessonsSynced: true });
        if (changed) {
          set({ lessonsRead: currentRead });
          get()._checkModuleComplete();
        }
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

      // ── Price Alerts ───────────────────────────────────────
      priceAlerts: [],
      addPriceAlert: (symbol, condition, targetPrice) => {
        const alert = {
          id: Date.now().toString(36),
          symbol: symbol.toUpperCase(),
          condition, // 'above' | 'below'
          targetPrice: Number(targetPrice),
          triggered: false,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ priceAlerts: [...s.priceAlerts, alert] }));
      },
      removePriceAlert: (id) => set(s => ({ priceAlerts: s.priceAlerts.filter(a => a.id !== id) })),
      markAlertTriggered: (id) => {
        set(s => ({
          priceAlerts: s.priceAlerts.map(a => a.id === id ? { ...a, triggered: true } : a),
        }));
        get().awardXP(XP_VALUES.priceAlertTriggered, 'Price alert triggered!');
        get().awardLP(3, 'Price alert triggered', 'alert');
      },

      // ── Session Tracking ───────────────────────────────────
      firstSessionDate: null,
      sessionCount: 0,
      incrementSession: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        set({
          sessionCount: state.sessionCount + 1,
          firstSessionDate: state.firstSessionDate || today,
        });
      },

      // ── Onboarding ─────────────────────────────────────────
      landingDismissed: false,
      setLandingDismissed: (v) => set({ landingDismissed: v }),
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),
      hasSeenPaperModal: false,
      setHasSeenPaperModal: (v) => set({ hasSeenPaperModal: v }),
      showWalletWizard: false,
      setShowWalletWizard: (v) => set({ showWalletWizard: v }),
      tradeMode: 'simple', // 'simple' | 'advanced'
      setTradeMode: (v) => set({ tradeMode: v }),
      currencyDisplay: 'USD', // 'USD' | 'TTD'
      setCurrencyDisplay: (v) => set({ currencyDisplay: v }),
      hasSeenLearnHero: false,
      setHasSeenLearnHero: (v) => set({ hasSeenLearnHero: v }),
      experienceLevel: null, // 'beginner' | 'intermediate' | 'advanced'
      eli5Mode: false,
      setExperienceLevel: (level) => {
        set({ experienceLevel: level });
        if (level === 'beginner') {
          set({ eli5Mode: true, theme: 'light', tradeMode: 'simple' });
        }
      },
      setEli5Mode: (v) => set({ eli5Mode: v }),
      activeLevel: 'basics', // 'basics' | 'intermediate' | 'advanced'
      setActiveLevel: (level) => set({ activeLevel: level }),

      // ── Theme ──────────────────────────────────────────────
      theme: 'dark', // 'dark' | 'light'
      setTheme: (t) => set({ theme: t }),

      // ── Limit Orders ───────────────────────────────────────
      limitOrders: [],

      addLimitOrder: ({ side, symbol, qty, limitPrice, currency, market }) => {
        const order = {
          id: Date.now().toString(36),
          side, symbol, qty, limitPrice, currency, market,
          status: 'open', // 'open' | 'triggered' | 'cancelled'
          createdAt: new Date().toISOString(),
        };
        set(s => ({ limitOrders: [order, ...s.limitOrders].slice(0, 50) }));
        // Award XP for first limit order (one-time)
        if (!get().unlockedFeatures.includes('first_limit_order')) {
          get().awardXP(XP_VALUES.firstLimitOrder, 'First limit order placed!');
          set(s => ({ unlockedFeatures: [...s.unlockedFeatures, 'first_limit_order'] }));
        }
        get().awardLP(5, 'Limit order placed', 'limit_order');
        set(s => ({ pendingToasts: [...s.pendingToasts, {
          id: 'lo:placed:' + order.id,
          type: 'xp',
          title: '📋 Limit Order Placed',
          message: `${side === 'buy' ? 'Buy' : 'Sell'} ${qty} ${symbol} when price ${side === 'buy' ? '≤' : '≥'} ${limitPrice}`,
        }]}));
      },

      cancelLimitOrder: (id) => {
        set(s => ({
          limitOrders: s.limitOrders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o),
        }));
      },

      checkLimitOrders: (currentPrices) => {
        // currentPrices: { SOL: { price }, BONK: { price }, ... }
        const state = get();
        const open = state.limitOrders.filter(o => o.status === 'open');
        if (!open.length) return;

        open.forEach(order => {
          const current = currentPrices[order.symbol]?.price
            ?? currentPrices[order.symbol?.toLowerCase()]?.current_price;
          if (!current) return;
          // Buy limit: execute when price falls to or below limit price
          // Sell limit: execute when price rises to or above limit price
          const hit = order.side === 'buy'
            ? current <= order.limitPrice
            : current >= order.limitPrice;
          if (!hit) return;

          const result = get().executeTrade(
            order.side, order.symbol, order.qty, order.limitPrice, order.currency, order.market
          );
          if (result.success) {
            set(s => ({
              limitOrders: s.limitOrders.map(o => o.id === order.id ? { ...o, status: 'triggered', triggeredAt: new Date().toISOString() } : o),
            }));
            set(s => ({ pendingToasts: [...s.pendingToasts, {
              id: 'lo:fill:' + order.id,
              type: 'level',
              title: '⚡ Limit Order Filled!',
              message: `${order.side === 'buy' ? 'Bought' : 'Sold'} ${order.qty} ${order.symbol} @ ${order.limitPrice}`,
            }]}));
          }
        });
      },

      // ── LP Simulation & Agent Squeeze ─────────────────────
      lpSimPositions: [],
      agentSqueezeUses: 0,
      visitedLPArmy: false,
      viewedFlywheel: false,

      openLPPosition: (positionData) => {
        const position = {
          id: Date.now().toString(36),
          ...positionData,
          openedAt: new Date().toISOString(),
          status: 'open',
          feesEarned: 0,
          ilLoss: 0,
        };
        set(s => ({ lpSimPositions: [position, ...s.lpSimPositions].slice(0, 20) }));
        get().awardXP(XP_VALUES.lpSimPosition || 100, 'Simulated LP position opened!');
        get().awardLP(30, 'LP position opened', 'lp_position');
        get()._checkBadges();
        track('lp_position_opened', { pair: positionData.pair, strategy: positionData.strategy });
      },

      closeLPPosition: (id) => {
        set(s => ({
          lpSimPositions: s.lpSimPositions.map(p =>
            p.id === id ? { ...p, status: 'closed', closedAt: new Date().toISOString() } : p
          ),
        }));
        track('lp_position_closed', { positionId: id });
      },

      recordAgentSqueezeUse: () => {
        set(s => ({ agentSqueezeUses: s.agentSqueezeUses + 1 }));
        get().awardXP(XP_VALUES.agentSqueezeUse || 30, 'Agent Squeeze analysis!');
        get().awardLP(10, 'Agent Squeeze used', 'squeeze');
        get()._checkBadges();
        track('agent_squeeze_used', { totalUses: get().agentSqueezeUses });
      },

      markLPArmyVisited: () => {
        if (get().visitedLPArmy) return;
        set({ visitedLPArmy: true });
        get().awardXP(XP_VALUES.lpArmyVisit || 40, 'LP Army Academy visited!');
        get().awardLP(15, 'LP Army visit', 'lp_army');
        get()._checkBadges();
        track('lp_army_visited');
      },

      // ── Paper Perpetual Futures ──────────────────────────
      perpPositions: [],
      perpTradeCount: 0,
      perpTotalPnl: 0,

      // ── Competition-grade liquidation price calculator ──
      // Accounts for: opening fee, accumulated funding, maintenance margin
      _calcLiqPrice: (side, entryPrice, leverage, collateral, accFunding = 0) => {
        const mm = 0.05; // 5% maintenance margin
        const openingFee = collateral * leverage * 0.001; // 0.1% of notional
        const effectiveCollateral = collateral - openingFee - accFunding;
        if (effectiveCollateral <= 0) return side === 'long' ? entryPrice : 0; // already bust
        const effectiveLeverage = (collateral * leverage) / effectiveCollateral;
        return side === 'long'
          ? Math.max(0, entryPrice * (1 - (1 / effectiveLeverage) + mm))
          : Math.max(0, entryPrice * (1 + (1 / effectiveLeverage) - mm));
      },

      openPerpPosition: (symbol, side, leverage, collateral, entryPrice, { stopLoss, takeProfit, trailingStop } = {}) => {
        if (!symbol || !side || !leverage || !collateral || !entryPrice) return { error: 'Missing parameters' };
        if (collateral <= 0 || leverage < 1 || leverage > 20) return { error: 'Invalid leverage or collateral' };
        if (!Number.isFinite(collateral) || !Number.isFinite(entryPrice)) return { error: 'Invalid numbers' };

        const state = get();
        if (collateral > state.balanceUSD) return { error: 'Insufficient USD balance' };

        const size = collateral * leverage;
        const maintenanceMargin = 0.05; // 5%
        const direction = side === 'long' ? 1 : -1;

        // Competition-grade liquidation price (accounts for opening fee)
        const liqPrice = get()._calcLiqPrice(side, entryPrice, leverage, collateral, 0);

        const position = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          symbol,
          side,
          leverage,
          collateral,
          size,
          entryPrice,
          liquidationPrice: Math.max(0, liqPrice),
          unrealizedPnl: 0,
          accumulatedFunding: 0,
          stopLoss: stopLoss && Number.isFinite(stopLoss) ? stopLoss : null,
          takeProfit: takeProfit && Number.isFinite(takeProfit) ? takeProfit : null,
          trailingStop: trailingStop && Number.isFinite(trailingStop) ? trailingStop : null,
          _trailingPeak: null,
          status: 'open',
          openedAt: new Date().toISOString(),
          closedAt: null,
        };

        // Deduct collateral from paper balance
        set({
          balanceUSD: state.balanceUSD - collateral,
          perpPositions: [position, ...state.perpPositions].slice(0, 50),
          perpTradeCount: state.perpTradeCount + 1,
        });

        // Gamification rewards
        if (state.perpTradeCount === 0) {
          get().awardXP(100, 'First perp position opened!');
          get().awardLP(20, 'First perp position', 'perp_trade');
        } else {
          get().awardLP(10, 'Perp position opened', 'perp_trade');
        }
        if (state.perpTradeCount + 1 === 10) {
          get().awardXP(200, '10 perp trades milestone!');
          get().awardLP(50, '10 perp trades', 'perp_milestone');
        }

        // Record as trade for history
        const trade = {
          id: position.id, side: `perp_${side}`, symbol, qty: size / entryPrice,
          price: entryPrice, total: size, currency: 'USD', market: 'perpetuals',
          timestamp: position.openedAt, leverage,
        };
        set({ trades: [trade, ...get().trades].slice(0, 100) });

        // Track revenue (0.1% opening fee)
        const fee = size * 0.001;
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

        get()._checkBadges();
        get()._generateTeachingMoment({ side: `perp_${side}`, symbol, qty: size / entryPrice, price: entryPrice, total: size, market: 'perpetuals', leverage, stopLoss: position.stopLoss, trailingStop: position.trailingStop });
        get()._checkPracticeChallenges();
        get().logPerpEvent('open', { symbol, side, leverage, size, price: entryPrice, collateral, stopLoss: position.stopLoss, takeProfit: position.takeProfit, trailingStop: position.trailingStop });
        track('perp_position_opened', { symbol, side, leverage, size: Math.round(size) });
        return { success: true, position };
      },

      closePerpPosition: (positionId, markPrice, fraction = 1) => {
        const state = get();
        const pos = state.perpPositions.find(p => p.id === positionId && p.status === 'open');
        if (!pos) return { error: 'Position not found' };
        const frac = Math.min(1, Math.max(0.01, fraction));

        const direction = pos.side === 'long' ? 1 : -1;
        const priceDelta = (markPrice - pos.entryPrice) * direction;
        const fullPnl = (priceDelta / pos.entryPrice) * pos.size - pos.accumulatedFunding;
        const pnl = fullPnl * frac;
        const closedCollateral = pos.collateral * frac;

        // Return collateral + PnL to balance (min 0 — can't go negative from balance)
        const returnAmount = Math.max(0, closedCollateral + pnl);

        if (frac >= 0.99) {
          // Full close
          set({
            balanceUSD: state.balanceUSD + returnAmount,
            perpPositions: state.perpPositions.map(p =>
              p.id === positionId ? { ...p, status: 'closed', closedAt: new Date().toISOString(), unrealizedPnl: pnl } : p
            ),
            perpTotalPnl: state.perpTotalPnl + pnl,
          });
        } else {
          // Partial close — reduce position + recalculate liq price
          const remainCollateral = pos.collateral * (1 - frac);
          const remainSize = pos.size * (1 - frac);
          const remainFunding = pos.accumulatedFunding * (1 - frac);
          const remainLeverage = remainSize / remainCollateral;
          const remainLiqPrice = get()._calcLiqPrice(pos.side, pos.entryPrice, remainLeverage, remainCollateral, remainFunding);
          set({
            balanceUSD: state.balanceUSD + returnAmount,
            perpPositions: state.perpPositions.map(p =>
              p.id === positionId ? {
                ...p,
                collateral: remainCollateral,
                size: remainSize,
                accumulatedFunding: remainFunding,
                liquidationPrice: remainLiqPrice,
              } : p
            ),
            perpTotalPnl: state.perpTotalPnl + pnl,
          });
        }

        // Record close trade
        const trade = {
          id: Date.now().toString(36), side: `close_${pos.side}`, symbol: pos.symbol,
          qty: (pos.size * frac) / markPrice, price: markPrice, total: pos.size * frac,
          currency: 'USD', market: 'perpetuals', timestamp: new Date().toISOString(),
          leverage: pos.leverage, pnl, partial: frac < 0.99 ? `${Math.round(frac * 100)}%` : null,
        };
        set({ trades: [trade, ...get().trades].slice(0, 100) });

        // Reward profitable closes
        if (pnl > 0) {
          get().awardLP(15, `Perp profit +$${pnl.toFixed(0)}`, 'perp_profit');
          get().awardXP(50, 'Profitable perp close!');
        } else {
          get().awardLP(5, 'Perp position closed', 'perp_close');
        }

        get()._checkBadges();
        get()._recordCompetitionTrade(pnl);
        get()._generateTeachingMoment({ side: `close_${pos.side}`, symbol: pos.symbol, qty: (pos.size * frac) / markPrice, price: markPrice, total: pos.size * frac, market: 'perpetuals', leverage: pos.leverage, pnl });
        get()._checkPracticeChallenges();
        get().logPerpEvent(frac < 0.99 ? 'partial_close' : 'close', { symbol: pos.symbol, side: pos.side, leverage: pos.leverage, pnl, price: markPrice, fraction: frac < 0.99 ? `${Math.round(frac * 100)}%` : null });
        track('perp_position_closed', { symbol: pos.symbol, pnl: Math.round(pnl), leverage: pos.leverage, fraction: frac });
        return { success: true, pnl };
      },

      checkPerpLiquidations: (currentPrices) => {
        // currentPrices: { SOL: price, BTC: price, ... }
        const state = get();
        const open = state.perpPositions.filter(p => p.status === 'open');
        if (!open.length) return;

        open.forEach(pos => {
          const markPrice = currentPrices[pos.symbol];
          if (!markPrice) return;

          const isLiquidated = pos.side === 'long'
            ? markPrice <= pos.liquidationPrice
            : markPrice >= pos.liquidationPrice;

          if (isLiquidated) {
            // Liquidation penalty: lose entire collateral minus 1% insurance fee
            const penaltyFee = pos.collateral * 0.01;
            set({
              perpPositions: get().perpPositions.map(p =>
                p.id === pos.id ? {
                  ...p, status: 'liquidated', closedAt: new Date().toISOString(),
                  unrealizedPnl: -pos.collateral,
                } : p
              ),
              perpTotalPnl: get().perpTotalPnl - pos.collateral,
            });

            // Track revenue from liquidation penalty
            const rev = get().simulatedRevenue;
            set({
              simulatedRevenue: {
                ...rev,
                totalPlatformRevenue: rev.totalPlatformRevenue + penaltyFee,
                communityPool: rev.communityPool + penaltyFee / 2,
                platformPool: rev.platformPool + penaltyFee / 2,
              },
            });

            // Record liquidation as trade
            set({ trades: [{
              id: Date.now().toString(36) + 'liq', side: 'liquidated', symbol: pos.symbol,
              qty: pos.size / markPrice, price: markPrice, total: pos.collateral,
              currency: 'USD', market: 'perpetuals', timestamp: new Date().toISOString(),
              leverage: pos.leverage, pnl: -pos.collateral,
            }, ...get().trades].slice(0, 100) });

            get().awardLP(5, 'Liquidated — lesson learned!', 'perp_liquidation');
            get().awardXP(20, 'Experienced liquidation');
            get()._recordCompetitionTrade(-pos.collateral);
            set(s => ({ pendingToasts: [...s.pendingToasts, {
              id: 'liq:' + pos.id,
              type: 'badge',
              title: '💀 Position Liquidated',
              message: `${pos.side.toUpperCase()} ${pos.symbol} ${pos.leverage}x — lost $${pos.collateral.toFixed(0)} collateral`,
            }]}));

            get().logPerpEvent('liquidation', { symbol: pos.symbol, side: pos.side, leverage: pos.leverage, price: markPrice, loss: -pos.collateral });
            track('perp_liquidated', { symbol: pos.symbol, leverage: pos.leverage, collateral: Math.round(pos.collateral) });
          }
        });
      },

      accruePerpFunding: () => {
        // Simulated funding rate: 0.01% per 8 hours
        // Called periodically (e.g., every price refresh)
        const state = get();
        const open = state.perpPositions.filter(p => p.status === 'open');
        if (!open.length) return;

        // Only accrue every 5 minutes (avoid spam on 12s refresh)
        const now = Date.now();
        const lastAccrual = state._lastFundingAccrual || 0;
        if (now - lastAccrual < 5 * 60 * 1000) return;

        const fundingRate = 0.0001; // 0.01% per interval (simplified)
        set({
          _lastFundingAccrual: now,
          perpPositions: state.perpPositions.map(p => {
            if (p.status !== 'open') return p;
            const funding = p.size * fundingRate;
            const newAccFunding = p.accumulatedFunding + funding;
            // Recalculate liq price — funding erodes effective collateral over time
            const newLiqPrice = get()._calcLiqPrice(p.side, p.entryPrice, p.leverage, p.collateral, newAccFunding);
            return { ...p, accumulatedFunding: newAccFunding, liquidationPrice: newLiqPrice };
          }),
        });
      },

      updatePerpSLTP: (positionId, { stopLoss, takeProfit }) => {
        const state = get();
        const pos = state.perpPositions.find(p => p.id === positionId && p.status === 'open');
        if (!pos) return { error: 'Position not found' };
        set({
          perpPositions: state.perpPositions.map(p =>
            p.id === positionId ? {
              ...p,
              stopLoss: stopLoss !== undefined ? (stopLoss && Number.isFinite(stopLoss) ? stopLoss : null) : p.stopLoss,
              takeProfit: takeProfit !== undefined ? (takeProfit && Number.isFinite(takeProfit) ? takeProfit : null) : p.takeProfit,
            } : p
          ),
        });
        track('perp_sltp_updated', { symbol: pos.symbol, stopLoss, takeProfit });
        return { success: true };
      },

      checkPerpSLTP: (currentPrices) => {
        const state = get();
        const open = state.perpPositions.filter(p => p.status === 'open');
        if (!open.length) return;

        open.forEach(pos => {
          const markPrice = currentPrices[pos.symbol];
          if (!markPrice) return;

          // Check Take Profit
          if (pos.takeProfit) {
            const tpHit = pos.side === 'long'
              ? markPrice >= pos.takeProfit
              : markPrice <= pos.takeProfit;
            if (tpHit) {
              get().logPerpEvent('tp_triggered', { symbol: pos.symbol, side: pos.side, leverage: pos.leverage, price: markPrice, target: pos.takeProfit });
              get().closePerpPosition(pos.id, markPrice);
              set(s => ({ pendingToasts: [...s.pendingToasts, {
                id: 'tp:' + pos.id,
                type: 'badge',
                title: 'Take Profit Hit',
                message: `${pos.side.toUpperCase()} ${pos.symbol} ${pos.leverage}x — TP at ${markPrice.toFixed(2)}`,
              }]}));
              return; // position already closed
            }
          }

          // Check Stop Loss
          if (pos.stopLoss) {
            const slHit = pos.side === 'long'
              ? markPrice <= pos.stopLoss
              : markPrice >= pos.stopLoss;
            if (slHit) {
              get().logPerpEvent('sl_triggered', { symbol: pos.symbol, side: pos.side, leverage: pos.leverage, price: markPrice, trigger: pos.stopLoss });
              get().closePerpPosition(pos.id, markPrice);
              set(s => ({ pendingToasts: [...s.pendingToasts, {
                id: 'sl:' + pos.id,
                type: 'badge',
                title: 'Stop Loss Triggered',
                message: `${pos.side.toUpperCase()} ${pos.symbol} ${pos.leverage}x — SL at ${markPrice.toFixed(2)}`,
              }]}));
            }
          }
        });
      },

      // ─── Adjust Margin (add/remove collateral on open position) ───
      adjustPerpMargin: (positionId, amount) => {
        const state = get();
        const pos = state.perpPositions.find(p => p.id === positionId && p.status === 'open');
        if (!pos) return { error: 'Position not found' };
        if (!amount || !Number.isFinite(amount)) return { error: 'Invalid amount' };
        if (amount > 0 && amount > state.balanceUSD) return { error: 'Insufficient balance' };
        const newCollateral = pos.collateral + amount;
        if (newCollateral < 1) return { error: 'Minimum collateral is $1' };

        // Recalculate liquidation price with new collateral (accounts for accumulated funding)
        const newLeverage = pos.size / newCollateral;
        const liqPrice = get()._calcLiqPrice(pos.side, pos.entryPrice, newLeverage, newCollateral, pos.accumulatedFunding);

        set({
          balanceUSD: state.balanceUSD - amount,
          perpPositions: state.perpPositions.map(p =>
            p.id === positionId ? { ...p, collateral: newCollateral, liquidationPrice: Math.max(0, liqPrice) } : p
          ),
        });
        track('perp_margin_adjusted', { symbol: pos.symbol, amount, newCollateral });
        return { success: true, newCollateral, newLeverage: newLeverage.toFixed(1) };
      },

      // ─── Trailing Stop Logic ────────────────────────────────────
      checkTrailingStops: (currentPrices) => {
        const state = get();
        const open = state.perpPositions.filter(p => p.status === 'open' && p.trailingStop);
        if (!open.length) return;

        const updates = [];
        open.forEach(pos => {
          const markPrice = currentPrices[pos.symbol];
          if (!markPrice) return;
          const trail = pos.trailingStop; // percentage, e.g. 0.03 = 3%

          if (pos.side === 'long') {
            // Track highest price, trail SL below it
            const peak = Math.max(pos._trailingPeak || pos.entryPrice, markPrice);
            const newSL = peak * (1 - trail);
            if (peak !== pos._trailingPeak || newSL !== pos.stopLoss) {
              updates.push({ id: pos.id, _trailingPeak: peak, stopLoss: newSL });
            }
          } else {
            // Track lowest price, trail SL above it
            const trough = Math.min(pos._trailingPeak || pos.entryPrice, markPrice);
            const newSL = trough * (1 + trail);
            if (trough !== pos._trailingPeak || newSL !== pos.stopLoss) {
              updates.push({ id: pos.id, _trailingPeak: trough, stopLoss: newSL });
            }
          }
        });

        if (updates.length) {
          set({
            perpPositions: state.perpPositions.map(p => {
              const u = updates.find(x => x.id === p.id);
              return u ? { ...p, ...u } : p;
            }),
          });
        }
      },

      // ─── Event Log (order history feed) ─────────────────────────
      perpEventLog: [],
      logPerpEvent: (type, details) => {
        const event = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4), type, ...details, timestamp: new Date().toISOString() };
        set(s => ({ perpEventLog: [event, ...s.perpEventLog].slice(0, 50) }));
      },

      markFlywheelViewed: () => {
        if (get().viewedFlywheel) return;
        set({ viewedFlywheel: true });
        get().awardXP(XP_VALUES.flywheelView || 20, 'Solana Flywheel explored!');
        get().awardLP(5, 'Flywheel viewed', 'flywheel');
        get()._checkBadges();
        track('flywheel_viewed');
      },

      // ── Listing Applications ───────────────────────────────
      listingApplications: [],

      submitListingApplication: (data) => {
        const app = { ...data, timestamp: new Date().toISOString(), status: 'submitted' };
        set({ listingApplications: [...get().listingApplications, app] });
        get().awardLP(100, 'Listing application submitted', 'listing');
      },

      // ── Trading Competition ─────────────────────────────────
      competitionRegistered: false,
      competitionStats: {
        pnlPct: 0,
        trades: 0,
        wins: 0,
        maxDrawdown: 0,
        dailyReturns: [],
        peakBalance: INITIAL_USD,
        _lastDayLogged: null,
        _dayStartBalance: INITIAL_USD,
      },

      registerForCompetition: () => {
        if (get().competitionRegistered) return;
        const bal = get().balanceUSD;
        set({
          competitionRegistered: true,
          competitionStats: {
            pnlPct: 0,
            trades: 0,
            wins: 0,
            maxDrawdown: 0,
            dailyReturns: [],
            peakBalance: bal,
            _lastDayLogged: new Date().toISOString().slice(0, 10),
            _dayStartBalance: bal,
          },
        });
        get().awardXP(50, 'Joined Season 1 Competition!');
        get().awardLP(25, 'Competition registration', 'competition');
        set(s => ({
          pendingToasts: [...s.pendingToasts, {
            id: 'comp-register',
            type: 'badge',
            title: '🏆 Competition Registered!',
            message: 'Season 1 — Caribbean Trading Cup. Good luck!',
          }],
        }));
        track('competition_registered');
      },

      /**
       * Record a competition trade outcome.
       * Called after executeTrade or closePerpPosition when competition is active.
       *
       * Defensive: persisted state from older app versions may be missing some
       * nested fields (e.g. `dailyReturns` could be `undefined`, which would
       * throw on spread). We reconstruct the stats object with safe defaults
       * for every field before mutating so older sessions cannot crash.
       */
      _recordCompetitionTrade: (pnlAmount) => {
        if (!get().competitionRegistered) return;
        const existing = get().competitionStats || {};
        const cs = {
          pnlPct: Number.isFinite(existing.pnlPct) ? existing.pnlPct : 0,
          trades: Number.isFinite(existing.trades) ? existing.trades : 0,
          wins: Number.isFinite(existing.wins) ? existing.wins : 0,
          maxDrawdown: Number.isFinite(existing.maxDrawdown) ? existing.maxDrawdown : 0,
          dailyReturns: Array.isArray(existing.dailyReturns) ? [...existing.dailyReturns] : [],
          peakBalance: Number.isFinite(existing.peakBalance) ? existing.peakBalance : INITIAL_USD,
          _lastDayLogged: existing._lastDayLogged || null,
          _dayStartBalance: Number.isFinite(existing._dayStartBalance) ? existing._dayStartBalance : INITIAL_USD,
        };
        const bal = get().balanceUSD;
        const openPerps = Array.isArray(get().perpPositions) ? get().perpPositions : [];
        const totalValue = bal + openPerps
          .filter(p => p && p.status === 'open')
          .reduce((s, p) => s + (Number.isFinite(p.collateral) ? p.collateral : 0), 0);

        cs.trades += 1;
        if (pnlAmount > 0) cs.wins += 1;
        cs.pnlPct = ((totalValue - INITIAL_USD) / INITIAL_USD) * 100;

        // Track peak and drawdown
        if (totalValue > cs.peakBalance) cs.peakBalance = totalValue;
        const drawdown = cs.peakBalance > 0 ? ((cs.peakBalance - totalValue) / cs.peakBalance) * 100 : 0;
        if (drawdown > cs.maxDrawdown) cs.maxDrawdown = drawdown;

        // Daily return tracking
        const today = new Date().toISOString().slice(0, 10);
        if (cs._lastDayLogged !== today) {
          // Log yesterday's return
          const dayReturn = cs._dayStartBalance > 0
            ? ((totalValue - cs._dayStartBalance) / cs._dayStartBalance) * 100
            : 0;
          cs.dailyReturns = [...cs.dailyReturns, dayReturn].slice(-30); // Keep 30 days
          cs._lastDayLogged = today;
          cs._dayStartBalance = totalValue;
        }

        set({ competitionStats: cs });
      },

      // ── Percolator (On-Chain Perpetuals) ──────────────────────
      percolatorMode: 'paper',          // 'paper' | 'live'
      percolatorActiveMarket: null,     // slab pubkey string
      percolatorSlabState: null,        // parsed { header, config, accounts }
      percolatorUserIdx: null,          // user's account index in slab
      percolatorPositions: [],          // live on-chain positions

      setPercolatorMode: (mode) => {
        const xp = get().xp || 0;
        if (mode === 'live' && xp < 5000) {
          get().showToast?.(`Need 5,000 XP to unlock live perps (current: ${xp})`, 'warning');
          return;
        }
        set({ percolatorMode: mode });
      },
      setPercolatorActiveMarket: (slabPubkey) => {
        set({ percolatorActiveMarket: slabPubkey, percolatorSlabState: null });
      },
      updatePercolatorSlabState: (state) => set({ percolatorSlabState: state }),
      setPercolatorUserIdx: (idx) => set({ percolatorUserIdx: idx }),
      updatePercolatorPositions: (positions) => set({ percolatorPositions: positions }),
    }),
    {
      name: 'caribcrypto-storage',
      partialize: (state) => ({
        // SECURITY: walletAddress and walletConnected are NOT persisted.
        // Wallet state is re-established on connect via wallet-standard.
        // This prevents localStorage from becoming a behavioral dossier
        // linking wallet addresses to trade history.
        _storeVersion: 4,
        balanceUSD: state.balanceUSD, balanceTTD: state.balanceTTD,
        holdings: state.holdings, trades: state.trades,
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
        pendingReferralCode: state.pendingReferralCode,
        simulatedRevenue: state.simulatedRevenue,
        // LP Simulation & Agent Squeeze
        lpSimPositions: state.lpSimPositions,
        agentSqueezeUses: state.agentSqueezeUses,
        visitedLPArmy: state.visitedLPArmy,
        viewedFlywheel: state.viewedFlywheel,
        listingApplications: state.listingApplications,
        limitOrders: state.limitOrders,
        // Paper Perpetual Futures
        perpPositions: state.perpPositions,
        perpTradeCount: state.perpTradeCount,
        perpTotalPnl: state.perpTotalPnl,
        // Trading Competition
        competitionRegistered: state.competitionRegistered,
        competitionStats: state.competitionStats,
        // Percolator (on-chain perps mode preference)
        percolatorMode: state.percolatorMode,
        watchlist: state.watchlist,
        priceAlerts: state.priceAlerts,
        landingDismissed: state.landingDismissed,
        hasSeenOnboarding: state.hasSeenOnboarding,
        hasSeenPaperModal: state.hasSeenPaperModal,
        showWalletWizard: state.showWalletWizard,
        tradeMode: state.tradeMode,
        currencyDisplay: state.currencyDisplay,
        // Teaching Moments & Daily Knowledge
        teachingMomentsViewed: state.teachingMomentsViewed,
        viewedDailyKnowledge: state.viewedDailyKnowledge,
        lastDailyKnowledgeDate: state.lastDailyKnowledgeDate,
        viewedMicroLessons: state.viewedMicroLessons,
        tradeJournal: state.tradeJournal,
        journalPromptEnabled: state.journalPromptEnabled,
        completedPracticeChallenges: state.completedPracticeChallenges,
        activePracticeChallenge: state.activePracticeChallenge,
        hasSeenLearnHero: state.hasSeenLearnHero,
        experienceLevel: state.experienceLevel,
        eli5Mode: state.eli5Mode,
        activeLevel: state.activeLevel,
        theme: state.theme,
        streakShields: state.streakShields,
        lastShieldRefill: state.lastShieldRefill,
        firstSessionDate: state.firstSessionDate,
        sessionCount: state.sessionCount,
        // Survival Probability Interventions
        streakFeeCredits: state.streakFeeCredits,
        premiumConversionEvents: state.premiumConversionEvents,
        selectedChain: state.selectedChain,
      }),
      // ── Hydration safety ───────────────────────────────────────────
      // Persisted state from older app versions may omit fields we now
      // depend on. The default Zustand persist merge is shallow, so a
      // persisted `competitionStats` snapshot missing `dailyReturns` would
      // replace our defaults and crash `_recordCompetitionTrade`'s spread.
      // This merge function shallow-merges known-risky nested objects with
      // the current initial state so every field has a safe default.
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const merged = { ...current, ...persisted };
        // Nested: competitionStats — backfill missing fields with current defaults
        if (current.competitionStats) {
          const cur = current.competitionStats;
          const per = (persisted.competitionStats && typeof persisted.competitionStats === 'object')
            ? persisted.competitionStats
            : {};
          merged.competitionStats = {
            ...cur,
            ...per,
            dailyReturns: Array.isArray(per.dailyReturns) ? per.dailyReturns : cur.dailyReturns,
          };
        }
        // Array fields — if persisted value is not an array, fall back to current default
        const arrayFields = [
          'holdings', 'trades', 'lpHistory', 'lpReferrals', 'lpSimPositions',
          'listingApplications', 'limitOrders', 'perpPositions', 'watchlist',
          'priceAlerts', 'modulesCompleted', 'earnedBadges', 'unlockedFeatures',
          'viewedGlossaryTerms', 'teachingMomentsViewed', 'viewedMicroLessons',
          'tradeJournal', 'completedPracticeChallenges', 'premiumConversionEvents',
        ];
        for (const field of arrayFields) {
          if (field in persisted && !Array.isArray(persisted[field])) {
            merged[field] = Array.isArray(current[field]) ? current[field] : [];
          }
        }
        return merged;
      },
    }
  )
);

export default useStore;
