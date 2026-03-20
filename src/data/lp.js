import { TIERS } from './gamification';

export const LP_MULTIPLIERS = {
  1: 1.0,  // Sand Walker
  2: 1.2,  // Reef Spotter
  3: 1.5,  // Trade Wind
  4: 1.8,  // Island Navigator
  5: 2.0,  // Caribbean Captain
  6: 2.5,  // Limer Legend
};

export function getLPMultiplier(tierLevel) {
  return LP_MULTIPLIERS[tierLevel] || 1.0;
}

export const LP_ACTIONS = [
  { action: 'Execute a trade', lp: 10, multiplied: true, icon: '💹' },
  { action: 'Trade volume (per $100)', lp: 1, multiplied: true, icon: '📊' },
  { action: 'Hold position > 7 days', lp: 25, multiplied: true, icon: '⏳', note: 'One-time per position' },
  { action: 'Hold position > 30 days', lp: 100, multiplied: true, icon: '💎', note: 'One-time per position' },
  { action: 'Complete a lesson', lp: 5, multiplied: true, icon: '📚' },
  { action: 'Pass a quiz', lp: 15, multiplied: true, icon: '🧠' },
  { action: 'Perfect quiz score', lp: 25, multiplied: true, icon: '⭐' },
  { action: 'Complete a module', lp: 50, multiplied: true, icon: '🎓' },
  { action: 'Daily login streak', lp: '3 × day', multiplied: true, icon: '🔥' },
  { action: 'Connect wallet', lp: 50, multiplied: false, icon: '🔗', note: 'One-time' },
  { action: 'View glossary term', lp: 1, multiplied: false, icon: '📖' },
  { action: 'Referral signup', lp: 200, multiplied: false, icon: '🤝', note: 'Per referral' },
];

// Simulated leaderboard — deterministic fake users
const FAKE_NAMES = [
  'SolSurfer.sol', 'TriniTrader', 'IslandWhale', 'BajaCrypto',
  'MassyHolder', 'CaribbeanDAO', 'LimeStaker42', 'WamWallet',
  'SandDollarOG', 'ReefRunner', 'CoralCapital', 'PalmTreeFi',
  'TradeWinds_TT', 'JupiterJam', 'NFTCaribbe', 'RWARebelTT',
  'CryptoKitts', 'DigitalBajan', 'GuyanaGold', 'BelizeDeFi',
  'HaitiHODL', 'DominicaDAO', 'StKittsStake', 'LuciaLiquidity',
  'GrenadaGains', 'BarbadosBull', 'JamaicaJup', 'CubaChain',
  'PuertoPool', 'AntiguaAlpha', 'MontserratMine', 'VincentVault',
  'CaymanCrypto', 'NassauNode', 'SurinamStake', 'TobagoDeFi',
  'PortOfSpain.sol', 'KingstonKing', 'BridgetownBull', 'GeorgetownGem',
  'ParamariboP2E', 'BelmopanBot', 'RoseauRWA', 'CastriesCapital',
  'BassettereBTC', 'StGeorgeSOL', 'WillemstadW3', 'HamiltonHODL',
  'PlymouthProto', 'SpanishTownSPL',
];

export function generateLeaderboard(userLP, userName = 'You') {
  // Deterministic fake LP values
  const fakeUsers = FAKE_NAMES.map((name, i) => {
    const seed = (i + 1) * 7919; // prime-based seed
    const baseLp = Math.floor(((Math.sin(seed) * 10000 + 10000) % 10000) + 50);
    const multiplier = 1 + (i < 10 ? 3 : i < 20 ? 1.5 : 0.5);
    return { name, lp: Math.floor(baseLp * multiplier), isUser: false };
  });

  // Insert real user
  const allUsers = [...fakeUsers, { name: userName, lp: userLP, isUser: true }];
  allUsers.sort((a, b) => b.lp - a.lp);

  return allUsers.map((u, i) => ({ ...u, rank: i + 1 }));
}

export const AIRDROP_POOL = 200_000_000; // 200M $LIMER for airdrop
export const SIMULATED_TOTAL_LP = 500_000; // Simulated total LP in system
