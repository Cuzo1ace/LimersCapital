/**
 * Curriculum Metadata for University Partnerships
 *
 * Maps lesson IDs to learning objectives and assessment rubrics.
 * Kept separate from lessons.js to avoid modifying the core data structure
 * and breaking existing tests. CurriculumMode.jsx merges this data at render time.
 */

export const CURRICULUM_META = {
  // ── Module 1: Foundations ────────────────────────────────
  '1-1': {
    learningObjectives: [
      'Define Real-World Assets (RWAs) and explain their role in blockchain',
      'Identify at least 3 RWA tokens available on Solana',
      'Explain why RWAs reduce barriers for Caribbean investors',
    ],
    assessmentRubric: {
      excellent: 'Can explain RWA mechanics AND identify Caribbean-specific use cases',
      proficient: 'Can define RWAs and name key tokens',
      developing: 'Can recognize RWAs but struggles with specific examples',
    },
  },
  '1-2': {
    learningObjectives: [
      'Explain how blockchain provides a decentralized ledger',
      'Describe how Solana differs from other blockchains in speed and cost',
      'Differentiate between a public address and a private key',
    ],
    assessmentRubric: {
      excellent: 'Can explain decentralization benefits for Caribbean banking independence',
      proficient: 'Understands blockchain basics and wallet security',
      developing: 'Recognizes blockchain terminology but struggles with mechanics',
    },
  },
  '1-3': {
    learningObjectives: [
      'Set up a Solana wallet (testnet) independently',
      'Execute a test transaction and verify it on a block explorer',
      'Explain the concept of transaction fees (gas)',
    ],
    assessmentRubric: {
      excellent: 'Can set up wallet, send/receive tokens, and explain fees to a peer',
      proficient: 'Can set up wallet and execute basic transactions',
      developing: 'Needs guidance to complete wallet setup',
    },
  },
  '1-4': {
    learningObjectives: [
      'Define Central Bank Digital Currencies (CBDCs) and their purpose',
      'Identify Caribbean CBDCs (Sand Dollar, JAM-DEX, DCash)',
      'Explain how CBDCs bridge traditional finance and crypto for Caribbean populations',
    ],
    assessmentRubric: {
      excellent: 'Can compare Caribbean CBDC approaches and analyze policy implications',
      proficient: 'Can define CBDCs and name Caribbean implementations',
      developing: 'Understands digital currency concept but not Caribbean specifics',
    },
  },

  // ── Module 2: Caribbean Markets ─────────────────────────
  '2-1': {
    learningObjectives: [
      'Describe the structure and role of the Trinidad & Tobago Stock Exchange (TTSE)',
      'Identify major TTSE-listed companies and market indices',
      'Explain how tokenization could make Caribbean stocks more accessible',
    ],
    assessmentRubric: {
      excellent: 'Can analyze TTSE market data and propose tokenization benefits',
      proficient: 'Understands TTSE structure and tokenization concept',
      developing: 'Recognizes TTSE exists but cannot describe its mechanics',
    },
  },
  '2-2': {
    learningObjectives: [
      'Map the regulatory landscape across Caribbean jurisdictions',
      'Identify which Caribbean nations have dedicated crypto legislation',
      'Explain the significance of VASP licensing for platform operations',
    ],
    assessmentRubric: {
      excellent: 'Can compare regulatory approaches across 5+ Caribbean jurisdictions',
      proficient: 'Knows key regulatory frameworks (DARE Act, VASP, ECCU)',
      developing: 'Aware of regulation but cannot identify specific frameworks',
    },
  },
  '2-3': {
    learningObjectives: [
      'Explain the Caribbean remittance market and its economic impact',
      'Calculate cost differences between traditional and blockchain-based remittances',
      'Analyze how crypto platforms can reduce the remittance cost burden',
    ],
    assessmentRubric: {
      excellent: 'Can quantify remittance savings and model economic impact',
      proficient: 'Understands remittance costs and blockchain alternatives',
      developing: 'Knows remittances are important but not the cost dynamics',
    },
  },
  '2-4': {
    learningObjectives: [
      'Describe the Caribbean diaspora and its economic relationship to home countries',
      'Explain how financial platforms can serve transnational communities',
      'Identify opportunities at the intersection of diaspora finance and crypto',
    ],
    assessmentRubric: {
      excellent: 'Can design a financial product for the Caribbean diaspora',
      proficient: 'Understands diaspora economics and crypto opportunities',
      developing: 'Recognizes diaspora existence but not financial implications',
    },
  },

  // ── Module 3: Solana Ecosystem ──────────────────────────
  '3-1': {
    learningObjectives: [
      'Explain the Solana consensus mechanism (Proof of History + Proof of Stake)',
      'Compare Solana performance metrics to other major blockchains',
      'Identify the Solana validator network and its role in security',
    ],
    assessmentRubric: {
      excellent: 'Can explain Solana architecture and evaluate its trade-offs',
      proficient: 'Understands Solana speed/cost advantages and consensus basics',
      developing: 'Knows Solana is fast but not why',
    },
  },
  '3-2': {
    learningObjectives: [
      'Navigate the Solana DeFi ecosystem (Jupiter, Raydium, Marinade)',
      'Execute a token swap using Jupiter aggregator',
      'Explain how DEX aggregation optimizes trade execution',
    ],
    assessmentRubric: {
      excellent: 'Can compare DEX routes and explain slippage/price impact',
      proficient: 'Can use Jupiter to swap tokens and understand basic mechanics',
      developing: 'Needs guidance to navigate DeFi interfaces',
    },
  },
  '3-3': {
    learningObjectives: [
      'Define SOL staking and liquid staking (mSOL, JitoSOL)',
      'Calculate expected staking yields and understand APY vs APR',
      'Evaluate the risk/reward of different staking approaches',
    ],
    assessmentRubric: {
      excellent: 'Can model staking returns and compare liquid staking protocols',
      proficient: 'Understands staking mechanics and yield calculation',
      developing: 'Knows staking earns rewards but not the specifics',
    },
  },
  '3-4': {
    learningObjectives: [
      'Explain what NFTs are and their utility beyond art',
      'Describe dynamic NFTs (dNFTs) and their role in token economics',
      'Identify how dNFTs enable revenue distribution in the UBO model',
    ],
    assessmentRubric: {
      excellent: 'Can design a dNFT-based revenue model for a hypothetical project',
      proficient: 'Understands NFT types and dNFT utility',
      developing: 'Associates NFTs with art but not financial utility',
    },
  },

  // ── Module 4: Security & Strategy ───────────────────────
  '4-1': {
    learningObjectives: [
      'Identify common crypto risks (smart contract, market, custodial, regulatory)',
      'Apply risk management frameworks to portfolio construction',
      'Calculate position sizing based on risk tolerance',
    ],
    assessmentRubric: {
      excellent: 'Can construct a risk-managed portfolio with position limits',
      proficient: 'Identifies major risk categories and basic mitigation',
      developing: 'Aware of risk but cannot quantify or manage it',
    },
  },
  '4-2': {
    learningObjectives: [
      'Explain diversification and its mathematical basis (correlation)',
      'Build a diversified portfolio across asset classes and markets',
      'Analyze the benefits of holding both Caribbean (TTSE) and global (Solana) assets',
    ],
    assessmentRubric: {
      excellent: 'Can calculate portfolio correlation and optimize diversification',
      proficient: 'Understands diversification principle and applies it',
      developing: 'Knows not to put all eggs in one basket but lacks specifics',
    },
  },
  '4-3': {
    learningObjectives: [
      'Recognize common trading psychology traps (FOMO, loss aversion, anchoring)',
      'Implement a trading journal practice for self-awareness',
      'Develop a personal trading plan with entry/exit rules',
    ],
    assessmentRubric: {
      excellent: 'Maintains a trading journal and can identify personal bias patterns',
      proficient: 'Recognizes psychology traps and has a basic trading plan',
      developing: 'Knows emotions affect trading but cannot implement discipline',
    },
  },

  // ── Module 5: LP Foundations ─────────────────────────────
  '5-1': {
    learningObjectives: [
      'Define Automated Market Makers (AMMs) and how they enable decentralized trading',
      'Explain the constant product formula (x * y = k)',
      'Identify the role of liquidity providers in DeFi ecosystems',
    ],
    assessmentRubric: {
      excellent: 'Can derive price impact from the constant product formula',
      proficient: 'Understands AMM mechanics and LP role',
      developing: 'Knows LPs provide liquidity but not the mathematical basis',
    },
  },
  '5-2': {
    learningObjectives: [
      'Define impermanent loss and when it occurs',
      'Calculate impermanent loss for a given price change scenario',
      'Evaluate when LP fees offset impermanent loss',
    ],
    assessmentRubric: {
      excellent: 'Can model IL scenarios and determine break-even fee rates',
      proficient: 'Understands IL concept and can estimate magnitude',
      developing: 'Knows IL exists but cannot calculate it',
    },
  },
  '5-3': {
    learningObjectives: [
      'Compare constant product, concentrated, and dynamic liquidity models',
      'Explain how Meteora DLMM positions work',
      'Identify when each LP model is most appropriate',
    ],
    assessmentRubric: {
      excellent: 'Can select optimal LP model based on market conditions',
      proficient: 'Understands differences between LP models',
      developing: 'Knows multiple LP types exist but cannot compare them',
    },
  },
  '5-4': {
    learningObjectives: [
      'Read and interpret LP position analytics (fees earned, IL, net return)',
      'Monitor position health and know when to rebalance',
      'Use the LP simulator to test strategies before committing capital',
    ],
    assessmentRubric: {
      excellent: 'Can monitor, analyze, and optimize a simulated LP position',
      proficient: 'Can read LP analytics and identify key metrics',
      developing: 'Can view LP data but struggles with interpretation',
    },
  },
  '5-5': {
    learningObjectives: [
      'Explain yield farming and liquidity mining incentive structures',
      'Calculate real yield vs inflationary yield',
      'Evaluate the sustainability of different yield sources',
    ],
    assessmentRubric: {
      excellent: 'Can distinguish sustainable yield from unsustainable emissions',
      proficient: 'Understands yield farming mechanics and basic sustainability',
      developing: 'Knows yield farming exists but not its risks',
    },
  },

  // ── Module 6: LP Strategies ─────────────────────────────
  '6-1': {
    learningObjectives: [
      'Design a concentrated liquidity strategy for a specific token pair',
      'Set optimal price range boundaries based on volatility analysis',
      'Understand the risk/reward trade-off of tighter vs wider ranges',
    ],
    assessmentRubric: {
      excellent: 'Can back-test range strategies using historical data',
      proficient: 'Can set reasonable ranges and explain the trade-offs',
      developing: 'Understands ranges but struggles with optimal selection',
    },
  },
  '6-2': { learningObjectives: ['Explain dynamic rebalancing strategies', 'Identify triggers for position adjustment', 'Compare active vs passive LP management'], assessmentRubric: { excellent: 'Can design automated rebalancing rules', proficient: 'Understands when and why to rebalance', developing: 'Knows positions need adjustment but not when' } },
  '6-3': { learningObjectives: ['Analyze multi-pool strategies for risk distribution', 'Calculate combined yield across correlated pools', 'Design a portfolio of LP positions'], assessmentRubric: { excellent: 'Can construct optimized multi-pool portfolios', proficient: 'Understands multi-pool diversification', developing: 'Focuses on single pools only' } },
  '6-4': { learningObjectives: ['Identify market regime changes that affect LP returns', 'Adjust LP strategies for trending vs ranging markets', 'Use volatility indicators to time entry/exit'], assessmentRubric: { excellent: 'Can adapt strategy to market conditions in real-time', proficient: 'Recognizes regime changes and adjusts', developing: 'Uses same strategy regardless of conditions' } },
  '6-5': { learningObjectives: ['Explain how fee tiers affect LP profitability', 'Select appropriate fee tiers for different pair types', 'Model fee income under various volume scenarios'], assessmentRubric: { excellent: 'Can model fee income sensitivity to volume changes', proficient: 'Selects appropriate fee tiers with reasoning', developing: 'Defaults to standard fees without analysis' } },
  '6-6': { learningObjectives: ['Describe advanced hedging techniques for LP positions', 'Calculate hedge ratios for impermanent loss protection', 'Evaluate the cost of hedging vs accepting IL risk'], assessmentRubric: { excellent: 'Can construct hedged LP positions with calculated ratios', proficient: 'Understands hedging concepts for LPs', developing: 'Aware of hedging but cannot apply it to LPs' } },

  // ── Module 7: LP Mastery ────────────────────────────────
  '7-1': { learningObjectives: ['Use the Agent Squeeze simulator to test LP strategies', 'Interpret simulator results and optimize parameters', 'Compare simulator performance vs theoretical models'], assessmentRubric: { excellent: 'Achieves top-quartile simulator results consistently', proficient: 'Uses simulator effectively and improves over iterations', developing: 'Can run simulations but struggles with optimization' } },
  '7-2': { learningObjectives: ['Analyze real-world LP position data from Solana DeFi', 'Identify patterns in successful vs unsuccessful positions', 'Apply lessons from data analysis to strategy design'], assessmentRubric: { excellent: 'Can derive actionable insights from on-chain LP data', proficient: 'Reads and interprets LP analytics', developing: 'Can access data but needs help interpreting' } },
  '7-3': { learningObjectives: ['Design LP strategies for new token launches', 'Manage extreme volatility in early-stage pools', 'Evaluate bootstrapping liquidity mechanisms'], assessmentRubric: { excellent: 'Can design and defend a launch LP strategy', proficient: 'Understands launch dynamics and their LP implications', developing: 'Avoids new launches due to uncertainty' } },
  '7-4': { learningObjectives: ['Explain cross-protocol LP strategies', 'Identify opportunities in LP routing and arbitrage', 'Understand MEV and its impact on LP returns'], assessmentRubric: { excellent: 'Can identify and exploit cross-protocol opportunities', proficient: 'Understands cross-protocol dynamics', developing: 'Focuses on single-protocol strategies' } },
  '7-5': { learningObjectives: ['Build a complete LP management dashboard', 'Track key metrics: ROI, IL, fees, net PnL', 'Implement systematic review and adjustment cycles'], assessmentRubric: { excellent: 'Maintains systematic LP management with documented reviews', proficient: 'Tracks key metrics and reviews periodically', developing: 'Monitors sporadically without system' } },
  '7-6': { learningObjectives: ['Evaluate LP opportunities on emerging Solana protocols', 'Conduct due diligence on new DeFi protocols', 'Assess smart contract risk for LP positions'], assessmentRubric: { excellent: 'Can independently evaluate new protocols for LP safety', proficient: 'Follows a due diligence checklist', developing: 'LPs into new protocols without assessment' } },
  '7-7': { learningObjectives: ['Design LP strategies incorporating Caribbean market correlations', 'Explore TTSE-Solana cross-market LP opportunities', 'Model regional economic factors in LP decision-making'], assessmentRubric: { excellent: 'Can design Caribbean-specific LP strategies with economic rationale', proficient: 'Considers regional factors in LP decisions', developing: 'Treats all markets identically' } },
  '7-8': { learningObjectives: ['Synthesize all LP knowledge into a personal strategy document', 'Define risk parameters, target returns, and management rules', 'Present and defend strategy to peers'], assessmentRubric: { excellent: 'Produces a comprehensive, defensible LP strategy document', proficient: 'Creates a basic strategy with key parameters defined', developing: 'Has general ideas but no written framework' } },

  // ── Module 8: UBO Model ─────────────────────────────────
  '8-1': {
    learningObjectives: [
      'Define Universal Basic Ownership (UBO) and how it differs from UBI',
      'Explain the $LIMER token distribution model (50/50 community/platform)',
      'Analyze how UBO aligns user incentives with platform growth',
    ],
    assessmentRubric: {
      excellent: 'Can critique UBO vs traditional ownership models with economic reasoning',
      proficient: 'Understands UBO mechanics and distribution structure',
      developing: 'Knows UBO means users own something but not the specifics',
    },
  },
  '8-2': {
    learningObjectives: [
      'Describe the dNFT Yield Engine and how revenue accrues to holders',
      'Calculate expected yield based on staking tier and platform revenue',
      'Compare real yield models vs inflationary token emissions',
    ],
    assessmentRubric: {
      excellent: 'Can model yield scenarios under different revenue assumptions',
      proficient: 'Understands yield engine mechanics and staking tiers',
      developing: 'Knows staking earns rewards but not the calculation',
    },
  },
  '8-3': {
    learningObjectives: [
      'Explain on-chain governance via Realms and quadratic voting',
      'Describe the governance roadmap (LP → Token → Staking → DAO)',
      'Evaluate the role of the Wam ecosystem in the premium tier',
    ],
    assessmentRubric: {
      excellent: 'Can design governance proposals and analyze voting outcomes',
      proficient: 'Understands governance mechanics and roadmap progression',
      developing: 'Knows governance exists but not how to participate',
    },
  },
  '8-4': {
    learningObjectives: [
      'Synthesize all 8 modules into a personal Caribbean investment thesis',
      'Identify personal learning gaps and create a continued education plan',
      'Articulate how blockchain technology can serve Caribbean financial sovereignty',
    ],
    assessmentRubric: {
      excellent: 'Produces a compelling, data-backed Caribbean investment thesis',
      proficient: 'Creates a coherent thesis covering key themes',
      developing: 'Understands individual topics but struggles to synthesize',
    },
  },
};

/**
 * Get curriculum metadata for a lesson.
 * Returns null if no curriculum data exists for the lesson ID.
 */
export function getCurriculumMeta(lessonId) {
  return CURRICULUM_META[lessonId] || null;
}

/**
 * Check if all lessons have curriculum metadata.
 */
export function getCurriculumCoverage(lessonIds) {
  const covered = lessonIds.filter(id => CURRICULUM_META[id]);
  return {
    total: lessonIds.length,
    covered: covered.length,
    missing: lessonIds.filter(id => !CURRICULUM_META[id]),
    pct: Math.round((covered.length / lessonIds.length) * 100),
  };
}
