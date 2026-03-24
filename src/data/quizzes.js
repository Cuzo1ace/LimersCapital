// Quiz questions — answers are validated server-side via /game/quiz-submit.
// The `ans` and `why` fields are NOT shipped to the client to prevent cheating.
// After submission, the server returns which answers were correct + explanations.

export const QUIZZES = {
  'quiz-1': {
    id: 'quiz-1', moduleId: 'module-1', title: 'Foundations Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What is a Real-World Asset (RWA) in crypto?', opts: ['A physical coin', 'A tokenized version of a real asset like bonds or gold', 'A type of NFT artwork', 'A cryptocurrency mining rig'] },
      { q: 'What should you NEVER share with anyone?', opts: ['Your wallet address', 'Your seed phrase', 'Your transaction history', 'Your token balance'] },
      { q: 'How much does a typical Solana transaction cost?', opts: ['$5.00', '$0.50', 'Less than $0.01', '$1.00'] },
      { q: 'What is the purpose of a crypto wallet?', opts: ['To mine cryptocurrency', 'To store your private keys and interact with blockchain', 'To exchange fiat currency', 'To create new tokens'] },
      { q: 'Which project brought tokenized US Treasury bonds to Solana?', opts: ['Jupiter', 'Raydium', 'Ondo Finance', 'Marinade'] },
    ],
  },
  'quiz-2': {
    id: 'quiz-2', moduleId: 'module-2', title: 'Caribbean Markets Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What are the TTSE trading hours?', opts: ['9:00 AM – 4:00 PM', '9:30 AM – 12:30 PM AST', '8:00 AM – 3:00 PM', '10:00 AM – 2:00 PM'] },
      { q: 'Which Caribbean nation launched the world\'s first CBDC?', opts: ['Jamaica', 'Bahamas', 'Trinidad & Tobago', 'Barbados'] },
      { q: 'What does the DARE Act regulate?', opts: ['Solana validators', 'Digital asset businesses in the Bahamas', 'Real estate tokenization', 'Caribbean stock exchanges'] },
      { q: 'RFHL stock is priced at TT$106.10. If you buy 50 shares, what do you spend?', opts: ['TT$106.10', 'TT$5,305', 'TT$10,610', 'TT$1,061'] },
      { q: 'What is the TTSEC?', opts: ['A cryptocurrency exchange', 'Trinidad & Tobago Securities and Exchange Commission', 'A blockchain protocol', 'A digital wallet'] },
    ],
  },
  'quiz-3': {
    id: 'quiz-3', moduleId: 'module-3', title: 'Solana Ecosystem Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What does TVL stand for?', opts: ['Total Virtual Ledger', 'Total Value Locked', 'Token Volume Listed', 'Transaction Verification Layer'] },
      { q: 'NGL stock traded 68,235 shares today. What does high volume suggest?', opts: ['The price must have gone up', 'Strong investor interest and potential significant price movement', 'The company just listed', 'The price is stable'] },
      { q: 'What is slippage?', opts: ['A type of dividend', 'Price moving against you between placing and executing your order', 'A broker fee', 'When you forget your password'] },
      { q: 'What does Jupiter do on Solana?', opts: ['Mines new SOL tokens', 'Aggregates DEX liquidity for best swap prices', 'Issues stablecoins', 'Validates transactions'] },
      { q: 'If 1 USD = TT$6.79, how much USD is TT$1,358?', opts: ['$9.22', '$200', '$1,358', '$922'] },
    ],
  },
  'quiz-4': {
    id: 'quiz-4', moduleId: 'module-4', title: 'Security & Strategy Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What is a rug pull?', opts: ['A type of DeFi strategy', 'When a project team drains funds and disappears', 'A hardware wallet feature', 'A token burning mechanism'] },
      { q: 'You receive an unknown token in your wallet with a website URL. What should you do?', opts: ['Visit the website to claim rewards', 'Approve the token to see its value', 'Ignore it completely — it could drain your wallet', 'Send it to a friend'] },
      { q: 'What is a good rule for position sizing?', opts: ['Put 100% in the best token', 'Risk at most 1-2% of your portfolio per trade', 'Always go all-in on dips', 'Only invest in stablecoins'] },
      { q: 'Why should you diversify across TTSE and Solana?', opts: ['They are the same market', 'TTD stocks are less correlated to crypto, reducing overall risk', 'Solana tokens always go up', 'TTSE is more profitable'] },
      { q: 'Where should you store your seed phrase?', opts: ['In a notes app on your phone', 'In a screenshot in cloud storage', 'On paper in a secure location', 'In a DM to yourself'] },
    ],
  },
  'quiz-5': {
    id: 'quiz-5', moduleId: 'module-5', title: 'LP Fundamentals Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What does a Liquidity Provider (LP) do?', opts: ['Mines new tokens', 'Deposits tokens into a pool so traders can swap against it', 'Validates blockchain transactions', 'Creates new cryptocurrencies'] },
      { q: 'In the constant product formula x * y = k, what happens when someone buys token X?', opts: ['Both x and y increase', 'x decreases and y increases, making X more expensive', 'k changes to a new value', 'Nothing — prices are fixed'] },
      { q: 'What is Impermanent Loss?', opts: ['Losing your wallet password', 'The difference in value between holding tokens vs providing liquidity when prices change', 'A fee charged by the protocol', 'When a pool runs out of liquidity'] },
      { q: 'What advantage does Concentrated Liquidity (CLMM) offer over traditional AMMs?', opts: ['Zero fees for all trades', 'Up to 4,000x more capital efficiency by focusing liquidity in specific price ranges', 'Guaranteed profits with no risk', 'Automatic token creation'] },
      { q: 'How does Meteora\'s DLMM differ from traditional CLMMs?', opts: ['It uses discrete price bins instead of continuous tick ranges', 'It does not charge any fees', 'It only works with stablecoins', 'It requires no capital to start'] },
    ],
  },
  'quiz-6': {
    id: 'quiz-6', moduleId: 'module-6', title: 'Meteora Mastery Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'Which pool type is best for set-and-forget passive LP?', opts: ['DLMM with 1 bps bin step', 'DAMM v2 with dynamic fees', 'One-sided LP with tight range', 'Spot concentration'] },
      { q: 'What does a smaller bin step in DLMM mean?', opts: ['Less precision, fewer bins', 'More precision, more bins, better for stable pairs', 'Higher fees for traders', 'Faster transaction speed'] },
      { q: 'What do Meteora Dynamic Vaults do?', opts: ['Create new tokens', 'Automatically allocate deposits across lending protocols to optimize yield', 'Provide concentrated liquidity', 'Validate transactions on Solana'] },
      { q: 'What is the single best indicator of LP profitability?', opts: ['Total TVL of the pool', 'Volume/TVL ratio — higher means more fees per dollar of liquidity', 'The token price', 'Number of LPs in the pool'] },
      { q: 'What is one-sided LP?', opts: ['Providing only one token — like limit orders that earn fees while waiting', 'Providing equal amounts of two tokens', 'Only earning fees in one direction', 'A scam technique'] },
    ],
  },
  'quiz-7': {
    id: 'quiz-7', moduleId: 'module-7', title: 'Advanced LP Strategies Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What is the main risk of Spot Concentration strategy?', opts: ['Too many fees earned', 'Price moving outside your tight range, requiring frequent rebalancing', 'The protocol taking your tokens', 'Other LPs copying your strategy'] },
      { q: 'What market condition is best for Volatility Harvesting?', opts: ['Strong uptrend', 'Choppy, directionless markets where price oscillates back and forth', 'Bear market crash', 'Low volume markets'] },
      { q: 'What is a good max allocation to any single LP position?', opts: ['100% — go all in on the best pool', '20% of your portfolio', '50% of your portfolio', '75% of your portfolio'] },
      { q: 'What is the IL breakeven calculation?', opts: ['Total fees earned divided by total deposited', 'The number of days of fee earnings needed to offset impermanent loss from a price move', 'Your position size times the fee rate', 'The point where TVL equals volume'] },
      { q: 'What does the Solana LP flywheel describe?', opts: ['A new token launch mechanism', 'A self-reinforcing cycle where more LPs create deeper liquidity, attracting more volume and fees', 'A hardware wallet feature', 'A type of rug pull'] },
    ],
  },
};
