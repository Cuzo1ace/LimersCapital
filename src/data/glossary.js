// Categories used to group terms in the Learn → Glossary tab.
// Order here drives the order categories render.
export const GLOSSARY_CATEGORIES = [
  { key: 'foundations', label: 'Foundations',           icon: '🧱', tagline: 'The building blocks every trader needs to recognise.' },
  { key: 'trading',     label: 'Trading & Markets',     icon: '💹', tagline: 'How tokens change hands on-chain.' },
  { key: 'liquidity',   label: 'Liquidity Pools',       icon: '🌊', tagline: 'Where the depth comes from — and how LPs earn it.' },
  { key: 'yield',       label: 'Yield & Farming',       icon: '🌾', tagline: 'Putting idle capital to work.' },
  { key: 'risk',        label: 'Risk & Loss',           icon: '⚠️', tagline: 'What can go wrong and how to read it early.' },
  { key: 'caribbean',   label: 'Caribbean & Regulation', icon: '🌴', tagline: 'Local context: licensing, currency, and CBDCs.' },
];

const DEF_DICT = 'https://www.defieducationfund.org/docs/educational/defi-dictionary/';
const DEF_101 = 'https://www.defieducationfund.org/docs/educational/defi-101-readings/';

export const GLOSSARY = [
  // ── Foundations ─────────────────────────────────────────────────────────────
  {
    term: 'RWA',
    category: 'foundations',
    def: 'Real-World Asset — a blockchain token representing ownership in a physical or traditional financial asset like bonds, real estate, or gold.',
    metaphor: 'A digital deed. The paper title to the house lives in a vault; the token in your wallet is the receipt the world reads.',
    deepContext: 'RWAs let off-chain assets settle with on-chain speed: 24/7 transfer, programmable splits, transparent ownership. The token is only as trustworthy as the issuer and custodian standing behind it — always check who holds the underlying asset and under what regulator. In the Caribbean this matters: tokenised TTSE shares would still be subject to Trinidad & Tobago securities law.',
    source: DEF_DICT,
  },
  {
    term: 'Mint',
    category: 'foundations',
    def: 'On Solana, the unique address identifying a specific token (like a contract address on Ethereum). Each token has exactly one mint address.',
    metaphor: 'The serial number of the printing press. Every USDC bill came off the same press; the mint address is that press’s ID.',
    deepContext: 'Two tokens with the same name can have different mints — and one of them is usually a scam. Always verify the mint address from a trusted source (the project’s docs, Jupiter’s strict list) before swapping or sending. On Solana the mint authority can be revoked, which is what makes a supply truly fixed.',
    source: DEF_DICT,
  },
  {
    term: 'Stablecoin',
    category: 'foundations',
    def: 'A token pegged to a stable asset like USD. USDC and PYUSD are popular on Solana. Essential for holding value between trades.',
    metaphor: 'The cash drawer of crypto. You park value here between trades the same way a cashier counts the float at end of day.',
    deepContext: 'Stablecoins come in three flavours: fiat-backed (USDC, PYUSD — held 1:1 in a bank), crypto-backed (DAI — over-collateralised by other crypto), and algorithmic (rare and historically fragile). The peg only holds while the issuer’s reserves and redemptions stay credible — the 2023 USDC depeg lasted hours, not days, because Circle stayed liquid.',
    source: DEF_DICT,
  },
  {
    term: 'Market Cap',
    category: 'foundations',
    def: 'Price × Circulating Supply. Measures a project\'s total value. A $0.01 token with 1T supply = $10B market cap — price alone is misleading.',
    metaphor: 'A house listed at TT$1 million isn’t the same as a 5,000-unit apartment block where each costs TT$1,000 — total value, not unit price, is what the market is buying.',
    deepContext: 'Two metrics matter: circulating market cap (what’s liquid today) and fully diluted valuation (FDV — what it would be if every future token unlocked). A token with low circulating cap and huge FDV will face years of selling pressure as insiders unlock.',
    source: DEF_DICT,
  },

  // ── Trading & Markets ───────────────────────────────────────────────────────
  {
    term: 'DEX',
    category: 'trading',
    def: 'Decentralized Exchange — a peer-to-peer marketplace for trading crypto without intermediaries. Jupiter is Solana\'s leading DEX aggregator.',
    metaphor: 'A market square instead of a bank lobby. Anyone can set up a stall (pool); buyers walk straight to the best price without asking a broker.',
    deepContext: 'A pure DEX never holds your funds — you sign a transaction from your wallet and the smart contract does the swap atomically. An aggregator like Jupiter routes through many DEXs at once to find the best execution. Trade-off: no chargebacks, no customer service, no recourse if you sign a bad transaction.',
    source: DEF_101,
  },
  {
    term: 'AMM',
    category: 'trading',
    def: 'Automated Market Maker — a smart contract that enables token trading using mathematical formulas instead of order books. The foundation of all DEX trading on Solana.',
    metaphor: 'A vending machine for tokens. Price comes from a formula based on what’s in the machine, not from haggling with a cashier.',
    deepContext: 'Most AMMs use the constant-product formula `x · y = k`: the more of one token you buy, the more expensive the next unit becomes. Order books need active market makers quoting bids and asks; AMMs only need a pool. The cost is slippage — large trades move the price along the curve.',
    source: DEF_101,
  },
  {
    term: 'Slippage',
    category: 'trading',
    def: 'The difference between expected price and execution price, caused by low liquidity. More common in thinly-traded TTSE stocks and small Solana pools.',
    metaphor: 'You see TT$10 on the price tag, but by the time you reach the till the last few are gone and you pay TT$10.80 — that 8% gap is slippage.',
    deepContext: 'Set a slippage tolerance on every swap (Jupiter defaults to 0.5%). Too tight and the trade reverts; too loose and a sandwich-attack bot front-runs you. For thin pools or volatile tokens, split the order into smaller chunks instead of raising the tolerance.',
    source: DEF_DICT,
  },
  {
    term: 'APY',
    category: 'trading',
    def: 'Annual Percentage Yield — the annualized return including compounding. USDY from Ondo offers ~5% APY backed by US Treasury bills.',
    metaphor: 'Your sou-sou hand if you re-played it every cycle for a full year — APY assumes you keep stacking the rewards back in.',
    deepContext: 'APY > APR because of compounding. Both are forward-looking estimates; the actual return depends on rates, fees, and (for LP positions) impermanent loss. Always ask: what asset is the yield paid in? A 50% APY paid in a token that drops 60% is a loss.',
    source: DEF_DICT,
  },

  // ── Liquidity Pools ─────────────────────────────────────────────────────────
  {
    term: 'Liquidity Pool',
    category: 'liquidity',
    def: 'A smart contract holding two tokens that traders swap against. Providers deposit both tokens and earn a share of every swap fee.',
    metaphor: 'Like a sou-sou where two currencies sit together. Anyone can swap from the pile, and the depositors collect a small fee on every swap.',
    deepContext: 'When you deposit, you receive an LP token representing your share of the pool. Fees accrue automatically — you collect them when you withdraw. The risk: as prices move, the pool rebalances, and the value of your two tokens together can be less than if you’d simply held them (impermanent loss).',
    source: DEF_DICT,
  },
  {
    term: 'CLMM',
    category: 'liquidity',
    def: 'Concentrated Liquidity Market Maker — an AMM where LPs focus liquidity in specific price ranges for higher capital efficiency. Used by Orca Whirlpools and Raydium.',
    metaphor: 'Stocking only the shoe sizes that actually sell. You earn more per square foot of shelf, but if customers ask for sizes you don’t carry you make nothing.',
    deepContext: 'CLMM lets you say "I only want exposure between $1.95 and $2.05 of this stablecoin pair." Inside that range, your capital works much harder than a full-range LP. Outside it, you earn zero fees and end up 100% in whichever side the price exited toward — you’re effectively a limit order until you rebalance.',
    source: DEF_DICT,
  },
  {
    term: 'DLMM',
    category: 'liquidity',
    def: 'Dynamic Liquidity Market Maker — Meteora\'s innovation using discrete price bins instead of continuous ticks. Offers zero-slippage within bins and flexible distribution patterns.',
    metaphor: 'Instead of a smooth ramp, a staircase. Each step (bin) is a flat price, so swaps inside the step have no slippage at all.',
    deepContext: 'Bins make it easier to design custom liquidity shapes — spot, curve, bid-ask — without coding. Inside one bin you face zero price impact. Across bins, price moves discretely, which makes rebalancing strategies more legible.',
    source: DEF_DICT,
  },
  {
    term: 'DAMM',
    category: 'liquidity',
    def: 'Dynamic AMM — Meteora\'s full-range AMM with dynamic fees that adjust based on market volatility. Ideal for passive, set-and-forget liquidity provision.',
    metaphor: 'A taxi with surge pricing. When the market is choppy the fare goes up; when it’s calm you pay the base rate.',
    deepContext: 'Dynamic fees compensate LPs more during volatile periods, when impermanent-loss risk is highest. Full range means no rebalancing chore — you trade some capital efficiency for true passivity.',
    source: DEF_DICT,
  },
  {
    term: 'Bin Step',
    category: 'liquidity',
    def: 'In DLMM pools, the percentage price increment between adjacent bins. Smaller bin steps (1-2 bps) offer more precision; larger steps (10-20 bps) require less management.',
    metaphor: 'Stair height. Short steps let you tiptoe (precise but more steps to climb); tall steps cover ground fast but feel coarse.',
    deepContext: 'Choose narrow bin steps for stablecoin pairs where price barely moves; wider steps for volatile pairs where you’d be rebalancing every hour otherwise. The right step is the one whose width matches the volatility you expect.',
    source: DEF_DICT,
  },
  {
    term: 'Fee Tier',
    category: 'liquidity',
    def: 'The percentage fee charged on each swap through a liquidity pool. Higher tiers (1%) earn more per trade but attract less volume; lower tiers (0.01%) attract more volume.',
    metaphor: 'Wholesale vs. boutique pricing. The boutique earns big on each sale but sees fewer customers; the wholesaler earns pennies but does it a thousand times an hour.',
    deepContext: 'Stablecoin pairs sit at 0.01–0.05% (high volume, tiny fee). Major volatile pairs sit at 0.30%. Long-tail or exotic pairs sit at 1%+. The right tier per token pair is whatever maximises (fee × volume) for the LP.',
    source: DEF_DICT,
  },
  {
    term: 'Concentrated Liquidity',
    category: 'liquidity',
    def: 'The practice of providing liquidity only within a specific price range, dramatically increasing capital efficiency compared to full-range positions.',
    metaphor: 'Fishing where the fish bite. Same net, dropped only at the productive depth — much bigger catch per hour.',
    deepContext: 'Concentrated positions earn more fees per dollar deposited but require active management: when price exits your range you stop earning. Wider ranges are more passive but spread your capital thinner. Pick range width based on how often you’re willing to rebalance.',
    source: DEF_DICT,
  },
  {
    term: 'One-Sided Liquidity',
    category: 'liquidity',
    def: 'Providing only one token to an LP position. Acts like a limit order that earns fees while waiting to be filled. Common strategy in DLMM pools.',
    metaphor: 'A standing buy order at the market — except you collect rent (fees) the whole time you’re waiting.',
    deepContext: 'You deposit only the token you’d be happy to sell at the chosen price. As the market crosses your bins, the pool converts your token to the other side and you exit "filled." If price never reaches you, you keep your original token plus fees collected.',
    source: DEF_DICT,
  },
  {
    term: 'Capital Efficiency',
    category: 'liquidity',
    def: 'How effectively your deposited capital generates returns. Concentrated liquidity is up to 4,000x more capital efficient than full-range positions.',
    metaphor: 'Fares-per-driver. Two cars on the road, but the one parked outside the airport earns ten times more — same asset, smarter placement.',
    deepContext: 'Higher capital efficiency = more fees per dollar of deposit, but also more management work and more impermanent-loss exposure when price moves. Treat it as a dial, not a free lunch — the extra yield always comes with extra risk.',
    source: DEF_DICT,
  },

  // ── Yield & Farming ─────────────────────────────────────────────────────────
  {
    term: 'Yield Farming',
    category: 'yield',
    def: 'Earning returns by providing tokens to DeFi protocols — includes LP fees, lending interest, staking rewards, and protocol token incentives.',
    metaphor: 'Renting out your tools. Your hammer (capital) sits idle in the shed; lend it to the protocol and it pays rent every block.',
    deepContext: 'Real yield comes from real activity — swap fees, borrow interest. Incentive yield is paid in a protocol’s own token and only lasts while emissions do. Always separate the two before deciding if a position pencils out.',
    source: DEF_101,
  },
  {
    term: 'Liquidity Mining',
    category: 'yield',
    def: 'Earning additional token rewards (beyond swap fees) for providing liquidity. Protocols use this to bootstrap new pools and attract LPs.',
    metaphor: 'Like a coupon for shopping at a new mall. The store opens, hands out vouchers; once enough customers show up, the vouchers stop.',
    deepContext: 'Bootstrap incentives end. The headline APY today usually halves or quarters once emissions taper. Sticky liquidity follows real fee revenue, not subsidies — read the emissions schedule before depositing.',
    source: DEF_DICT,
  },
  {
    term: 'Protocol Fees',
    category: 'yield',
    def: 'A portion of swap fees retained by the protocol (not the LP). Meteora protocol fees fund development and may be distributed to token holders.',
    metaphor: 'The market square charges every stall a cut. Stallholders (LPs) keep most of the takings; the rest funds the square’s upkeep.',
    deepContext: 'Protocol fees fund development, security audits, and sometimes token-holder distributions ("real yield"). When a token represents a claim on protocol fees, its value tracks volume more closely than incentive-only tokens.',
    source: DEF_DICT,
  },
  {
    term: 'Rebalancing',
    category: 'yield',
    def: 'Adjusting an LP position when price moves outside your range — withdrawing and redepositing at the new price. Required for concentrated liquidity strategies.',
    metaphor: 'Moving your fishing net to where the fish moved. Same gear, new spot — but you lose a few minutes (and gas) every time you re-cast.',
    deepContext: 'Each rebalance costs gas and locks in any impermanent loss for that range. Rebalance too often and fees eat your yield; too rarely and your capital sits idle outside the range. Automated managers (Kamino, Krystal) automate the trade-off for a cut.',
    source: DEF_DICT,
  },
  {
    term: 'TVL',
    category: 'yield',
    def: 'Total Value Locked — the total capital deposited in a DeFi protocol\'s smart contracts. Higher TVL generally indicates more trust.',
    metaphor: 'How much money the bank holds in deposits — a rough measure of how much the public trusts it.',
    deepContext: 'TVL is a trust signal but not a quality one: incentive farming can inflate it temporarily, and a high-TVL pool with low volume earns LPs almost nothing. Pair TVL with volume and revenue to judge if a protocol is actually being used.',
    source: DEF_DICT,
  },
  {
    term: 'TVL/Volume Ratio',
    category: 'yield',
    def: 'Daily trading volume divided by Total Value Locked. The key indicator of LP profitability — higher ratios mean more fees earned per dollar of liquidity deposited.',
    metaphor: 'Inventory turnover. The corner shop that sells through its stock daily makes more than the warehouse sitting on the same shelves for a month.',
    deepContext: 'A pool with $1M TVL doing $5M/day in volume earns its LPs roughly 5× more per dollar than the same pool doing $1M/day. Look for high turnover, not just high TVL — that’s where LPs actually get paid.',
    source: DEF_DICT,
  },

  // ── Risk & Loss ─────────────────────────────────────────────────────────────
  {
    term: 'Impermanent Loss',
    category: 'risk',
    def: 'The difference in value between holding tokens and providing them as liquidity, caused by price ratio changes. Becomes permanent only when you withdraw at different prices.',
    metaphor: 'The gap between what you’d have if you’d just kept the cash in your wallet vs. what you have after the pool rebalanced under you. Only locks in when you cash out.',
    deepContext: 'When one token in your pair pumps, the AMM sells it for the other to keep the ratio — so you end up with less of the winner than if you’d held. Fees and incentives can offset IL, but in volatile pairs you need a lot of volume to break even. Stablecoin pairs minimise IL by design.',
    source: DEF_DICT,
  },

  // ── Caribbean & Regulation ──────────────────────────────────────────────────
  {
    term: 'VASP',
    category: 'caribbean',
    def: 'Virtual Asset Service Provider — a regulated entity offering crypto services such as exchanges, custodians, or wallet providers. Wam is a VASP-licensed company in Trinidad & Tobago with Central Bank approval.',
    metaphor: 'The crypto equivalent of a bank licence. The licence doesn’t guarantee good judgement, but it means a regulator can shut them down if they break the rules.',
    deepContext: 'VASP is the FATF (Financial Action Task Force) category that brings exchanges and custodians under AML/KYC rules. Trinidad & Tobago’s framework is anchored in Central Bank approval — Wam is the local example. Using a licensed VASP gives you legal recourse a self-custody wallet doesn’t.',
    source: DEF_DICT,
  },
  {
    term: 'CBDC',
    category: 'caribbean',
    def: 'Central Bank Digital Currency — a digital form of fiat currency issued by a central bank. Examples: Sand Dollar (Bahamas), JAM-DEX (Jamaica).',
    metaphor: 'Government-issued digital cash. The same TT dollar the central bank already prints — just in token form, with the central bank as the only issuer.',
    deepContext: 'CBDCs are different from stablecoins: a stablecoin is issued by a private company holding reserves; a CBDC is liability of the central bank itself. The Bahamas Sand Dollar (2020) and Jamaica’s JAM-DEX (2022) are the two regional precedents — both prioritise inclusion over privacy.',
    source: DEF_DICT,
  },
  {
    term: 'TTD',
    category: 'caribbean',
    def: 'Trinidad & Tobago Dollar — the currency used on the TTSE. 1 USD ≈ TT$6.79. Always note which currency a stock is priced in.',
    metaphor: 'The TT dollar — same money you spend at Massy. On crypto rails, anything quoted in TTD will need an FX conversion before it talks to USDC or SOL.',
    deepContext: 'TTSE equities are priced in TTD; most DeFi quotes in USD or USDC. When tokenising a TTSE share or comparing yields, you’re really making two bets: the asset and the TTD/USD rate. Mock-TTDC pilots on Solana devnet are exploring how a TT-pegged stable could close that gap.',
    source: DEF_DICT,
  },
];
