export const TOKEN = {
  name: 'LIMER',
  symbol: '$LIMERR',
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
      { label: 'Airdrop (LP Holders)', pct: 20, tokens: 200_000_000, color: '#1DCC8A' },
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
      { label: 'Team & Founders', pct: 15, tokens: 150_000_000, color: '#FF5C4D', vesting: '4yr linear, 1yr cliff' },
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
  { source: 'Trading Fees (0.3%)', pct: 45, icon: '💹' },
  { source: 'TTSE Listing Fees', pct: 20, icon: '🏛️' },
  { source: 'Premium Features', pct: 15, icon: '⭐' },
  { source: 'Institutional Services', pct: 10, icon: '🏦' },
  { source: 'Cross-chain Bridge Fees', pct: 10, icon: '🌉' },
];

export const GOVERNANCE_ROADMAP = [
  { phase: 'Phase 1', title: 'LP Accumulation', desc: 'Limer Points system live. Earn LP through trading, learning, and referrals. Community building and beta testing.', status: 'active' },
  { phase: 'Phase 2', title: 'Token Launch', desc: '$LIMER TGE on Solana. Airdrop to LP holders based on accumulated points. DEX liquidity pools established.', status: 'upcoming' },
  { phase: 'Phase 3', title: 'Staking & Revenue', desc: 'Staking program live. Fee discounts for stakers. 50/50 revenue sharing begins flowing to community pool.', status: 'planned' },
  { phase: 'Phase 4', title: 'Full Governance', desc: 'On-chain voting via Realms. Treasury management by token holders. Community-driven listing decisions.', status: 'planned' },
];

export const VALUE_PROPS = [
  { icon: '💰', title: 'Revenue Share', desc: '50% of all platform fees flow directly to $LIMER holders through the community pool' },
  { icon: '🏷️', title: 'Fee Discounts', desc: 'Stake $LIMER to reduce trading fees by up to 60% across all markets' },
  { icon: '🗳️', title: 'Governance', desc: 'Vote on new listings, fee structures, treasury allocation, and platform direction' },
  { icon: '🎯', title: 'Early Access', desc: 'Priority access to new token listings, TTSE tokenizations, and platform features' },
  { icon: '🌴', title: 'Caribbean First', desc: 'The first token designed for Caribbean investors, bridging local markets to global DeFi' },
  { icon: '📈', title: 'Growth Upside', desc: 'As the platform grows, $LIMER value is backed by real revenue — not speculation' },
];
