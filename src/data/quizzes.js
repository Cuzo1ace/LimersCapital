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
};
