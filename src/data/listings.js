export const LISTING_TIERS = [
  {
    name: 'Explorer',
    price: 'Free',
    priceNote: 'Get started',
    icon: '🔭',
    color: '#00C8B4',
    features: [
      'Company profile on platform',
      'Basic market data display',
      'Community exposure to 10K+ users',
      'Real-time stock price tracking',
    ],
    cta: 'Get Listed Free',
  },
  {
    name: 'Pioneer',
    price: '$2,500',
    priceNote: 'per month',
    icon: '🚀',
    color: '#FFCA3A',
    popular: true,
    features: [
      'Everything in Explorer',
      'Tokenized trading simulation',
      'Investor analytics dashboard',
      'Featured placement in market view',
      'Priority support & onboarding',
      'Quarterly performance reports',
    ],
    cta: 'Apply Now',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'tailored solution',
    icon: '🏛️',
    color: '#C87EFF',
    features: [
      'Everything in Pioneer',
      'Custom SPL token issuance on Solana',
      'API integration with your systems',
      'White-label trading interface',
      'Dedicated account manager',
      'Custom compliance & reporting',
      'Cross-listed on partner exchanges',
    ],
    cta: 'Contact Us',
  },
];

export const LISTING_BENEFITS = [
  { icon: '🌍', title: 'Global Exposure', desc: 'Your stock accessible to international investors 24/7 — not just during TTSE hours' },
  { icon: '📊', title: 'Fractional Ownership', desc: 'Investors can buy fractions of a share, lowering barriers from TT$100+ to just $1' },
  { icon: '⚡', title: 'Instant Settlement', desc: 'Solana-based T+0 settlement replaces the TTSE\'s T+3 delay' },
  { icon: '👥', title: 'New Demographics', desc: 'Reach crypto-native Gen Z and millennial investors across the Caribbean diaspora' },
  { icon: '🔒', title: 'Regulatory Alignment', desc: 'Built within Caribbean regulatory frameworks — DARE Act, ECCU, TTSEC compliant' },
  { icon: '📈', title: 'Enhanced Liquidity', desc: '24/7 trading and global access increases your stock\'s market depth and price discovery' },
];

export const LISTING_FAQ = [
  { q: 'Do I need to change my TTSE listing?', a: 'No. Your TTSE listing remains unchanged. Limer\'s Capital creates a tokenized representation that trades on Solana alongside your existing listing.' },
  { q: 'How does tokenization work?', a: 'We issue SPL tokens on Solana backed by custodied shares. Each token represents fractional ownership in the underlying TTSE-listed security.' },
  { q: 'Is this legal in Trinidad & Tobago?', a: 'We work within the TTSEC framework and Caribbean regulatory guidelines. Our legal team ensures compliance with all applicable securities laws.' },
  { q: 'What does it cost?', a: 'Explorer tier is free — your company appears on our platform with live data. Pioneer and Enterprise tiers offer additional features at published rates.' },
  { q: 'How do investors buy tokenized shares?', a: 'Investors connect a Solana wallet (Solflare) and trade using USDC or SOL. They can also fund via Wam (TTD on-ramp).' },
  { q: 'Can I track investor analytics?', a: 'Pioneer and Enterprise tiers include dashboards showing investor demographics, trading volume, holder distribution, and engagement metrics.' },
];
