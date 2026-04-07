export const TOKEN = {
  name: 'LIMER',
  symbol: '$LIMER',
  chain: 'Solana',
  totalSupply: 1_000_000_000,
  decimals: 9,
};

export const DISTRIBUTION = {
  community: {
    label: 'Community',
    pct: 50,
    color: '#00C8B4',
    breakdown: [
      { label: 'Airdrop (LP Holders)', pct: 18, tokens: 180_000_000, color: '#1DCC8A' },
      { label: 'Solflare Wallet Boost', pct: 2, tokens: 20_000_000, color: '#E8AC41' },
      { label: 'Staking Rewards', pct: 15, tokens: 150_000_000, color: '#00C8B4' },
      { label: 'Liquidity Mining', pct: 10, tokens: 100_000_000, color: '#2D9B56' },
      { label: 'Community Grants', pct: 5, tokens: 50_000_000, color: '#FFCA3A' },
    ],
  },
  platform: {
    label: 'Platform',
    pct: 50,
    color: '#FF5C4D',
    breakdown: [
      { label: 'Team & Founders', pct: 14, tokens: 140_000_000, color: '#FF5C4D', vesting: '4yr linear, 1yr cliff' },
      { label: 'Solana Mobile Boost', pct: 1, tokens: 10_000_000, color: '#9945FF' },
      { label: 'Treasury', pct: 15, tokens: 150_000_000, color: '#C87EFF' },
      { label: 'Development Fund', pct: 10, tokens: 100_000_000, color: '#7EB2FF' },
      { label: 'Strategic Partners', pct: 10, tokens: 100_000_000, color: '#FB923C' },
    ],
  },
};

export const STAKING_TIERS = [
  { name: 'Bronze', icon: '🥉', min: 1_000, feeDiscount: 10, apyRange: '5-8%', governance: false, color: '#CD7F32' },
  { name: 'Silver', icon: '🥈', min: 10_000, feeDiscount: 25, apyRange: '8-12%', governance: true, color: '#C0C0C0' },
  { name: 'Gold', icon: '🥇', min: 100_000, feeDiscount: 40, apyRange: '12-18%', governance: true, color: '#FFD700' },
  { name: 'Platinum', icon: '💎', min: 1_000_000, feeDiscount: 60, apyRange: '18-25%', governance: true, color: '#E5E4E2' },
];

export const REVENUE_STREAMS = [
  { source: 'Spot Trading Fees (0.25%)', pct: 30, icon: '💹', collected: 'USDC', desc: 'Auto-converted via Jupiter aggregator' },
  { source: 'Perpetuals Fees (0.1% open + close)', pct: 25, icon: '📈', collected: 'USDC', desc: 'Collected from collateral' },
  { source: 'TTSE Listing & Trading (0.15%)', pct: 15, icon: '🏛️', collected: 'USDC/TTD', desc: 'Listing fees + per-trade commission' },
  { source: 'Premium Tier (Wam + ViFi Yield)', pct: 10, icon: '⭐', collected: 'USDC/SOL', desc: 'Monthly subscription — Wam ecosystem access (VASP-licensed, Central Bank approved), ViFi yield, and exclusive benefits' },
  { source: 'Institutional API Access', pct: 10, icon: '🏦', collected: 'USDC', desc: 'Tiered monthly plans for data and trading APIs' },
  { source: 'Solflare/Mobile Referral Fees', pct: 5, icon: '📱', collected: 'USDC', desc: 'Revenue share on referred trading volume' },
  { source: 'Bridge & Cross-chain Fees', pct: 5, icon: '🌉', collected: 'Native → USDC', desc: 'Per-transaction conversion fees' },
];

export const REVENUE_DISTRIBUTION = {
  community: { label: 'SPL Token Stakers', pct: 50, color: '#00C8B4', distributed: 'USDC (70%) + SOL (30%)', desc: 'Proportional to $LIMER staked. Weekly epoch distribution.' },
  platform: { label: 'Platform dNFT Holders', pct: 50, color: '#FF5C4D', distributed: 'USDC (70%) + SOL (30%)', desc: 'Revenue accrues to dNFTs. Team/Dev NFTs locked until vesting conditions met.' },
};

export const PREMIUM_BENEFITS = [
  { icon: '🌐', title: 'Wam Access', desc: 'Part of the Wam ecosystem — premium holders get Wam rewards, yield-bearing instruments, and discounted on/off ramp fees' },
  { icon: '📡', title: 'ViFi Yield', desc: 'Access decentralized WiFi yield through ViFi network — earn passive income from connectivity infrastructure' },
  { icon: '🔓', title: 'Early Token Access', desc: 'Priority access to new token listings, IDOs, and TTSE tokenizations before public launch' },
  { icon: '📊', title: 'Pro Analytics', desc: 'Advanced charting, on-chain flow data, whale tracking, and AI-powered trade signals' },
  { icon: '🎯', title: 'Boosted LP Rewards', desc: 'Up to 2x multiplier on Limer Points earning rate across all platform activities' },
  { icon: '🤝', title: 'Growing Benefits', desc: 'New partnerships and yield sources added as the platform grows — premium holders get first access' },
];

export const GOVERNANCE_ROADMAP = [
  { phase: 'Phase 1', title: 'LP Accumulation', desc: 'Limer Points system live. Earn LP through trading, learning, and referrals. Community building and beta testing.', status: 'active' },
  { phase: 'Phase 2', title: 'Token Launch', desc: '$LIMER TGE on Solana. Airdrop to LP holders based on accumulated points. DEX liquidity pools established.', status: 'upcoming' },
  { phase: 'Phase 3', title: 'Staking & Revenue', desc: 'Staking program live. Fee discounts for stakers. 50/50 revenue sharing begins flowing to community pool.', status: 'planned' },
  { phase: 'Phase 4', title: 'Full Governance', desc: 'On-chain voting via Realms. Treasury management by token holders. Community-driven listing decisions.', status: 'planned' },
];

export const VALUE_PROPS = [
  { icon: '💰', title: 'Real Yield in USDC + SOL', desc: '50% of protocol revenue distributed weekly in stablecoins and SOL — not inflationary token emissions' },
  { icon: '🏷️', title: 'Fee Discounts', desc: 'Stake $LIMER to reduce trading fees by up to 60% across all markets' },
  { icon: '🗳️', title: 'Governance', desc: 'Vote on new listings, fee structures, treasury allocation, and platform direction' },
  { icon: '🖼️', title: 'dNFT Yield Engine', desc: 'Platform allocation held in dynamic NFTs — transparent vesting, on-chain revenue accrual, publicly verifiable' },
  { icon: '🌴', title: 'Universal Basic Ownership', desc: 'The first protocol designed so every participant owns a share of the infrastructure they use' },
  { icon: '⭐', title: 'Premium: Wam + ViFi', desc: 'Premium holders unlock Wam ecosystem access (VASP-licensed digital TTD), ViFi yield, pro analytics, and growing benefits' },
];
