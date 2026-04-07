/**
 * Daily Knowledge Drops
 *
 * 100+ rotating facts/tips that change daily so returning users
 * always see something new. Uses deterministic date-seeded selection
 * (same pattern as weekly challenges in challenges.js).
 */

export const DAILY_KNOWLEDGE = [
  // ── Caribbean ─────────────────────────────────────────────
  { id: 'c1', cat: 'caribbean', title: 'The Bahamas DARE Act', content: 'The Bahamas passed the Digital Assets and Registered Exchanges (DARE) Act in 2020 — one of the most comprehensive crypto regulatory frameworks in the world. It classifies digital assets and requires exchanges to register.' },
  { id: 'c2', cat: 'caribbean', title: 'Sand Dollar: First National CBDC', content: 'The Bahamas launched the Sand Dollar in 2020, making it the first country in the world to roll out a central bank digital currency (CBDC) nationwide. It runs on a private blockchain managed by the Central Bank.' },
  { id: 'c3', cat: 'caribbean', title: 'Jamaica\'s JAM-DEX', content: 'Jamaica launched JAM-DEX in 2022, a CBDC managed by the Bank of Jamaica. It allows Jamaicans to transact digitally without a bank account, promoting financial inclusion across the island.' },
  { id: 'c4', cat: 'caribbean', title: 'DCash in the Eastern Caribbean', content: 'The Eastern Caribbean Central Bank launched DCash for 7 member states (Antigua, Dominica, Grenada, St Kitts, St Lucia, St Vincent, Montserrat). It\'s one of the few multi-country CBDC deployments globally.' },
  { id: 'c5', cat: 'caribbean', title: 'Cayman Islands: 0% Capital Gains', content: 'The Cayman Islands has no income tax, capital gains tax, or corporate tax — making it a hub for crypto hedge funds and Web3 companies. Over 200 crypto-related businesses are registered there.' },
  { id: 'c6', cat: 'caribbean', title: 'Trinidad\'s Wam Wallet', content: 'Wam is a VASP-licensed company with Central Bank of Trinidad & Tobago approval to provide a digital TTD and instant bank-to-platform transfers. Limer\'s Capital is part of the Wam ecosystem, giving users a regulated local bridge between traditional banking and on-chain finance.' },
  { id: 'c7', cat: 'caribbean', title: 'TTSE Market Cap', content: 'The Trinidad & Tobago Stock Exchange (TTSE) has a market capitalization exceeding TT$140 billion, with major listings including Republic Financial Holdings, Massy Holdings, and Guardian Holdings.' },
  { id: 'c8', cat: 'caribbean', title: 'Barbados Fintech Hub', content: 'Barbados has positioned itself as a Caribbean fintech hub with its Virtual Asset Business Act. The island nation has attracted crypto companies with clear regulatory frameworks and a skilled workforce.' },
  { id: 'c9', cat: 'caribbean', title: 'Guyana\'s Oil Boom', content: 'Guyana is the fastest-growing economy in the world thanks to offshore oil discoveries. This wealth could fuel adoption of blockchain-based financial services in the region.' },
  { id: 'c10', cat: 'caribbean', title: 'Caribbean Trade Settlement', content: 'Traditional stock trades in the Caribbean settle in T+3 days. Blockchain settlement happens in seconds. Tokenizing TTSE stocks on Solana could eliminate this 3-day wait entirely.' },
  { id: 'c11', cat: 'caribbean', title: 'ECCU Virtual Assets Bill', content: 'Seven Eastern Caribbean nations are harmonizing crypto regulation under a unified Virtual Asset Business Bill, creating one of the world\'s first multi-country crypto regulatory frameworks.' },
  { id: 'c12', cat: 'caribbean', title: 'Remittance Corridor', content: 'Caribbean nations receive billions annually in remittances, often with 5-10% fees. Crypto-based transfers via Solana can reduce this to under 1%, keeping more money in Caribbean communities.' },

  // ── Solana ────────────────────────────────────────────────
  { id: 's1', cat: 'solana', title: 'Solana\'s Speed', content: 'Solana processes over 4,000 transactions per second with ~400ms finality. For comparison, Ethereum averages ~15 TPS. This speed makes Solana ideal for real-time trading applications.' },
  { id: 's2', cat: 'solana', title: 'Transaction Costs', content: 'The average Solana transaction costs about $0.00025 — less than a tenth of a cent. This means you can trade actively without fees eating into your returns, unlike Ethereum where gas can cost $5-50.' },
  { id: 's3', cat: 'solana', title: 'Jupiter Aggregator', content: 'Jupiter is Solana\'s leading DEX aggregator, routing trades across Raydium, Orca, and dozens of other liquidity sources to find you the best price. It processes billions in daily volume.' },
  { id: 's4', cat: 'solana', title: 'Proof of History', content: 'Solana uses a unique consensus mechanism called Proof of History (PoH) that timestamps transactions before they enter a block. This is what enables its high throughput without sacrificing decentralization.' },
  { id: 's5', cat: 'solana', title: 'Solana\'s TVL Growth', content: 'Solana\'s Total Value Locked (TVL) in DeFi protocols has grown significantly, with billions locked across lending, DEXs, and liquid staking — making it the second-largest DeFi ecosystem.' },
  { id: 's6', cat: 'solana', title: 'Staking on Solana', content: 'SOL holders can stake their tokens with validators to earn ~7% APY while securing the network. Liquid staking tokens like mSOL and jitoSOL let you earn staking rewards while still using your SOL in DeFi.' },
  { id: 's7', cat: 'solana', title: 'Solana Mobile', content: 'Solana launched the Saga phone and Seeker devices — mobile-first hardware designed for Web3. The Solana Mobile Stack makes it easy to build crypto-native mobile experiences.' },
  { id: 's8', cat: 'solana', title: 'RWAs on Solana', content: 'Real-World Assets (RWAs) on Solana have surpassed $1.7 billion in TVL. Companies like Ondo Finance tokenize US Treasury bills on Solana, bringing traditional finance yields on-chain.' },
  { id: 's9', cat: 'solana', title: 'Compressed NFTs', content: 'Solana introduced compressed NFTs (cNFTs) that reduce minting costs by up to 99.9%. You can mint millions of NFTs for just a few dollars — enabling use cases like digital receipts and membership cards.' },
  { id: 's10', cat: 'solana', title: 'Solana Actions & Blinks', content: 'Solana Actions let you embed blockchain transactions anywhere on the web. "Blinks" turn these into shareable links on Twitter/X — you can swap tokens, mint NFTs, or vote directly from a tweet.' },
  { id: 's11', cat: 'solana', title: 'Solana\'s Validator Network', content: 'Solana has over 1,500 validators across 30+ countries, making it one of the most decentralized proof-of-stake networks. The Nakamoto coefficient (minimum validators to halt the network) continues to increase.' },
  { id: 's12', cat: 'solana', title: 'Token Extensions', content: 'Solana\'s Token-2022 program adds features like confidential transfers, transfer hooks, and built-in interest — enabling compliant, programmable money that traditional finance institutions can use.' },

  // ── DeFi ──────────────────────────────────────────────────
  { id: 'd1', cat: 'defi', title: 'What is TVL?', content: 'Total Value Locked (TVL) measures how much money is deposited in a DeFi protocol. Higher TVL generally means more trust and deeper liquidity — but always check if TVL is from real demand or just incentive farming.' },
  { id: 'd2', cat: 'defi', title: 'How AMMs Work', content: 'Automated Market Makers (AMMs) replace order books with liquidity pools. When you swap tokens, you trade against the pool — and liquidity providers earn fees from every trade. The price adjusts mathematically based on supply and demand.' },
  { id: 'd3', cat: 'defi', title: 'Impermanent Loss Explained', content: 'When you provide liquidity to a pool, if one token\'s price changes significantly relative to the other, you end up with less value than if you\'d just held. This is called impermanent loss — it becomes permanent if you withdraw.' },
  { id: 'd4', cat: 'defi', title: 'Yield Farming', content: 'Yield farming means putting your crypto to work by providing liquidity, lending, or staking to earn rewards. Returns can range from 2-200% APY — but higher yields usually come with higher risk.' },
  { id: 'd5', cat: 'defi', title: 'Stablecoins', content: 'Stablecoins like USDC and USDT are pegged to the US dollar, giving you crypto\'s speed and programmability with fiat\'s stability. On Solana, USDC is the most-used stablecoin for trading and DeFi.' },
  { id: 'd6', cat: 'defi', title: 'Lending Protocols', content: 'DeFi lending lets you earn interest by depositing tokens, or borrow against your holdings without selling them. Rates adjust in real-time based on supply and demand — no bank or credit check needed.' },
  { id: 'd7', cat: 'defi', title: 'Concentrated Liquidity', content: 'CLMMs (Concentrated Liquidity Market Makers) let LPs focus their capital in a specific price range, earning more fees from less capital. Meteora and Orca on Solana both support this advanced LP strategy.' },
  { id: 'd8', cat: 'defi', title: 'Flash Loans', content: 'Flash loans let you borrow millions with zero collateral — as long as you repay within the same transaction. They\'re used for arbitrage, liquidations, and complex DeFi strategies.' },
  { id: 'd9', cat: 'defi', title: 'Oracle Networks', content: 'Oracles like Pyth Network feed real-world price data to smart contracts. Without oracles, DeFi protocols wouldn\'t know the current price of SOL, BTC, or gold — they\'re the bridge between off-chain and on-chain data.' },
  { id: 'd10', cat: 'defi', title: 'Liquid Staking', content: 'Liquid staking lets you stake SOL and receive a receipt token (like mSOL or jitoSOL) that you can still use in DeFi. You earn staking rewards AND DeFi yields simultaneously — the magic of composability.' },
  { id: 'd11', cat: 'defi', title: 'Protocol Revenue', content: 'The healthiest DeFi protocols generate real revenue from fees, not just token emissions. When evaluating a protocol, look at revenue vs TVL — sustainable protocols earn from genuine usage.' },
  { id: 'd12', cat: 'defi', title: 'Slippage', content: 'Slippage is the difference between the expected price and the actual execution price of a trade. Large trades in shallow pools cause more slippage. Always check price impact before swapping large amounts.' },

  // ── Trading ───────────────────────────────────────────────
  { id: 't1', cat: 'trading', title: 'The 1% Rule', content: 'Professional traders rarely risk more than 1-2% of their total capital on a single trade. With $100K, that means risking $1K-2K max per position. This ensures no single loss can devastate your portfolio.' },
  { id: 't2', cat: 'trading', title: 'Risk/Reward Ratio', content: 'Before entering a trade, calculate your risk/reward ratio. If you\'re risking $100 to potentially make $300, that\'s a 1:3 ratio. Most successful traders aim for at least 1:2 — the math works even with a 50% win rate.' },
  { id: 't3', cat: 'trading', title: 'Trading Journal', content: 'The most effective way to improve as a trader is keeping a journal. Write down WHY you entered each trade, your emotional state, and what you learned. Review weekly to spot patterns in your decision-making.' },
  { id: 't4', cat: 'trading', title: 'Dollar-Cost Averaging', content: 'DCA means buying a fixed dollar amount at regular intervals, regardless of price. It smooths out volatility and removes the stress of trying to time the market perfectly. It\'s one of the simplest winning strategies.' },
  { id: 't5', cat: 'trading', title: 'Support & Resistance', content: 'Support levels are prices where buyers historically step in, creating a floor. Resistance levels are where sellers appear, creating a ceiling. These zones help you set entry points, stop-losses, and take-profits.' },
  { id: 't6', cat: 'trading', title: 'Market vs Limit Orders', content: 'Market orders execute immediately at the current price. Limit orders only fill at your specified price or better. Use market orders for speed, limit orders for precision — especially in volatile markets.' },
  { id: 't7', cat: 'trading', title: 'Emotional Discipline', content: 'Fear and greed are a trader\'s worst enemies. Fear causes premature sells, greed causes holding too long. Having a plan with predefined entry, exit, stop-loss, and take-profit levels removes emotion from the equation.' },
  { id: 't8', cat: 'trading', title: 'Diversification', content: 'Don\'t put all your eggs in one basket. Spreading investments across different assets, markets (crypto + stocks), and strategies reduces risk. If one position fails, others can compensate.' },
  { id: 't9', cat: 'trading', title: 'Volume Confirms Moves', content: 'Price moves on high volume are more significant than those on low volume. A breakout with heavy volume is more likely to sustain than one on thin trading. Always check volume alongside price.' },
  { id: 't10', cat: 'trading', title: 'Trailing Stops', content: 'A trailing stop follows the price as it moves in your favor, then triggers if it reverses. It lets you ride trends while automatically protecting profits — set it and forget it.' },
  { id: 't11', cat: 'trading', title: 'Paper Trading Benefits', content: 'Paper trading isn\'t just for beginners. Professional traders use simulators to test new strategies before risking real capital. It builds confidence and reveals strategy flaws without financial consequences.' },
  { id: 't12', cat: 'trading', title: 'Leverage is a Tool', content: 'Leverage amplifies both gains AND losses. A 10x leveraged position means a 10% adverse move wipes out your entire margin. Start with low leverage (2-3x) and increase only as your risk management improves.' },

  // ── Regulation ────────────────────────────────────────────
  { id: 'r1', cat: 'regulation', title: 'Not Your Keys, Not Your Coins', content: 'When you hold crypto on an exchange, the exchange controls your private keys. Using a self-custody wallet like Solflare means only YOU can access your funds. This is the core principle of decentralization.' },
  { id: 'r2', cat: 'regulation', title: 'Seed Phrase Security', content: 'Your seed phrase (12-24 words) is the master key to your wallet. Never share it, never store it digitally, and never enter it on a website. Write it on paper and store it somewhere safe — treat it like a safety deposit key.' },
  { id: 'r3', cat: 'regulation', title: 'Smart Contract Risk', content: 'DeFi protocols are only as safe as their smart contracts. Bugs can lead to exploits. Look for audited protocols, check their track record, and never invest more than you can afford to lose in any single protocol.' },
  { id: 'r4', cat: 'regulation', title: 'Phishing Awareness', content: 'Never click links in DMs, emails, or pop-ups claiming to be from wallets or exchanges. Always navigate directly to the official website. Scammers create convincing fake sites to steal your credentials.' },
  { id: 'r5', cat: 'regulation', title: 'KYC in the Caribbean', content: 'Know Your Customer (KYC) requirements vary across Caribbean nations. The Bahamas, Cayman, and Jamaica all require crypto businesses to verify user identities — similar to traditional banking compliance.' },
  { id: 'r6', cat: 'regulation', title: 'Tax Considerations', content: 'Crypto tax treatment varies by country. In many Caribbean nations, crypto tax frameworks are still evolving. Keep records of all trades — cost basis, sale price, and dates — even in paper trading, to build good habits.' },
  { id: 'r7', cat: 'regulation', title: 'FATF Travel Rule', content: 'The Financial Action Task Force (FATF) requires crypto businesses to share sender/receiver information for transfers over $1,000. Caribbean nations are adapting their regulations to comply with these global standards.' },
  { id: 'r8', cat: 'regulation', title: 'Approval ≠ Safety', content: 'Just because a token transaction was "approved" doesn\'t mean the protocol is safe. Unlimited token approvals can expose your entire balance. Regularly review and revoke unnecessary approvals using tools like Revoke.cash.' },
  { id: 'r9', cat: 'regulation', title: 'Rug Pull Warning Signs', content: 'Watch for anonymous teams, locked liquidity with short timers, unrealistic yield promises, and tokens with concentrated holder distribution. If it sounds too good to be true, it usually is.' },
  { id: 'r10', cat: 'regulation', title: 'Hardware Wallets', content: 'For significant holdings, use a hardware wallet like Ledger. It keeps your private keys offline, making them immune to malware and phishing attacks. Think of it as a safe for your digital assets.' },

  // ── Mixed / Fun Facts ─────────────────────────────────────
  { id: 'f1', cat: 'solana', title: 'Solana\'s Name', content: 'Solana is named after Solana Beach, a small coastal city north of San Diego, California. Co-founders Anatoly Yakovenko and Raj Gokal lived and surfed there while building the protocol.' },
  { id: 'f2', cat: 'defi', title: 'DeFi Summer', content: 'The summer of 2020 is known as "DeFi Summer" — when protocols like Compound, Uniswap, and Aave exploded in popularity. TVL went from $1B to $10B in months, proving that permissionless finance was viable.' },
  { id: 'f3', cat: 'trading', title: 'The Efficient Market Hypothesis', content: 'This theory says all known information is already reflected in asset prices. While debatable, it teaches a valuable lesson: consistently beating the market is extremely difficult. Focus on risk management over speculation.' },
  { id: 'f4', cat: 'caribbean', title: 'Caribbean Blockchain Hub', content: 'The Caribbean has become a testing ground for blockchain innovation. Between CBDCs, crypto regulation, and tokenized assets, the region is pioneering how developing economies can leapfrog traditional financial infrastructure.' },
  { id: 'f5', cat: 'defi', title: 'The First DEX Trade', content: 'The concept of decentralized trading existed before DeFi. Early DEXs were clunky and slow. Today, Solana DEXs like Jupiter handle billions in volume daily with sub-second execution — faster than most centralized exchanges.' },
  { id: 'f6', cat: 'trading', title: 'Max Drawdown', content: 'Max drawdown measures the largest peak-to-trough decline in your portfolio. A 50% drawdown requires a 100% gain to recover. Keeping max drawdown low (under 20%) is more important than chasing high returns.' },
  { id: 'f7', cat: 'solana', title: 'Pyth Network', content: 'Pyth is the oracle powering prices on Limer\'s Capital. It aggregates price data from 90+ institutional sources and delivers sub-second updates. Unlike Chainlink, Pyth sources data directly from market makers and exchanges.' },
  { id: 'f8', cat: 'caribbean', title: 'Financial Inclusion Gap', content: 'Over 50% of adults in some Caribbean nations are unbanked or underbanked. DeFi and mobile wallets can provide financial services — savings, lending, transfers — to anyone with a smartphone, no bank branch needed.' },
  { id: 'f9', cat: 'trading', title: 'The Power of Compounding', content: 'A consistent 1% monthly return compounds to 12.7% annually. A consistent 2% monthly return compounds to 26.8%. Small, steady gains beat occasional big wins. Consistency is the real edge in trading.' },
  { id: 'f10', cat: 'defi', title: 'Governance Tokens', content: 'Many DeFi protocols issue governance tokens that let holders vote on protocol changes — fee structures, new features, treasury spending. Holding $LIMER will give you a voice in how Limer\'s Capital evolves.' },
];

const CATEGORY_ICONS = {
  caribbean: '🌴',
  solana: '⚡',
  defi: '🔗',
  trading: '📈',
  regulation: '🛡️',
};

const CATEGORY_COLORS = {
  caribbean: '#FFCA3A',
  solana: '#00ffa3',
  defi: '#bf81ff',
  trading: '#00d4ff',
  regulation: '#FF5C4D',
};

/**
 * Get today's knowledge item, deterministically selected.
 * Same date always returns the same item (avoids randomness issues with localStorage).
 */
export function getDailyKnowledge(date = new Date(), viewedIds = []) {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000
  );
  const year = date.getFullYear();
  let seed = (year * 367 + dayOfYear) * 7919;

  const total = DAILY_KNOWLEDGE.length;

  // Try to find an unviewed item first
  for (let attempt = 0; attempt < total; attempt++) {
    const idx = ((seed + attempt) * 31 + 17) % total;
    const item = DAILY_KNOWLEDGE[Math.abs(idx) % total];
    if (!viewedIds.includes(item.id)) {
      return item;
    }
  }

  // All viewed — cycle back to start
  const idx = (seed * 31 + 17) % total;
  return DAILY_KNOWLEDGE[Math.abs(idx) % total];
}

export { CATEGORY_ICONS, CATEGORY_COLORS };
