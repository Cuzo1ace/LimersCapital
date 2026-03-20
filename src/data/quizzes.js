export const QUIZZES = {
  'quiz-1': {
    id: 'quiz-1', moduleId: 'module-1', title: 'Foundations Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What is a Real-World Asset (RWA) in crypto?', opts: ['A physical coin', 'A tokenized version of a real asset like bonds or gold', 'A type of NFT artwork', 'A cryptocurrency mining rig'], ans: 1, why: 'RWAs are blockchain tokens representing ownership in physical or traditional financial assets — bonds, real estate, gold, stocks.' },
      { q: 'What should you NEVER share with anyone?', opts: ['Your wallet address', 'Your seed phrase', 'Your transaction history', 'Your token balance'], ans: 1, why: 'Your seed phrase gives full control of your wallet. Anyone with it can steal all your assets. Never share it — not even with "support."' },
      { q: 'How much does a typical Solana transaction cost?', opts: ['$5.00', '$0.50', 'Less than $0.01', '$1.00'], ans: 2, why: 'Solana transactions typically cost less than $0.01 (around $0.00025), making it one of the cheapest blockchains for trading.' },
      { q: 'What is the purpose of a crypto wallet?', opts: ['To mine cryptocurrency', 'To store your private keys and interact with blockchain', 'To exchange fiat currency', 'To create new tokens'], ans: 1, why: 'A wallet stores your private keys and lets you send, receive, and interact with tokens on the blockchain. Popular Solana wallets: Solflare, Phantom.' },
      { q: 'Which project brought tokenized US Treasury bonds to Solana?', opts: ['Jupiter', 'Raydium', 'Ondo Finance', 'Marinade'], ans: 2, why: 'Ondo Finance tokenized US Treasury yields with USDY and brought institutional-grade RWA products to Solana.' },
    ],
  },
  'quiz-2': {
    id: 'quiz-2', moduleId: 'module-2', title: 'Caribbean Markets Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What are the TTSE trading hours?', opts: ['9:00 AM – 4:00 PM', '9:30 AM – 12:30 PM AST', '8:00 AM – 3:00 PM', '10:00 AM – 2:00 PM'], ans: 1, why: 'The TTSE trades Monday to Friday, 9:30 AM to 12:30 PM AST (Atlantic Standard Time).' },
      { q: 'Which Caribbean nation launched the world\'s first CBDC?', opts: ['Jamaica', 'Bahamas', 'Trinidad & Tobago', 'Barbados'], ans: 1, why: 'The Bahamas launched the Sand Dollar in October 2020 — the world\'s first fully deployed Central Bank Digital Currency.' },
      { q: 'What does the DARE Act regulate?', opts: ['Solana validators', 'Digital asset businesses in the Bahamas', 'Real estate tokenization', 'Caribbean stock exchanges'], ans: 1, why: 'The Digital Assets and Registered Exchanges (DARE) Act provides a comprehensive licensing framework for digital asset businesses in the Bahamas.' },
      { q: 'RFHL stock is priced at TT$106.10. If you buy 50 shares, what do you spend?', opts: ['TT$106.10', 'TT$5,305', 'TT$10,610', 'TT$1,061'], ans: 1, why: '50 shares × TT$106.10 = TT$5,305. Always multiply price by number of shares to calculate your total cost.' },
      { q: 'What is the TTSEC?', opts: ['A cryptocurrency exchange', 'Trinidad & Tobago Securities and Exchange Commission', 'A blockchain protocol', 'A digital wallet'], ans: 1, why: 'The TTSEC regulates the stock exchange, brokers, and listed companies to protect investors in Trinidad & Tobago.' },
    ],
  },
  'quiz-3': {
    id: 'quiz-3', moduleId: 'module-3', title: 'Solana Ecosystem Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What does TVL stand for?', opts: ['Total Virtual Ledger', 'Total Value Locked', 'Token Volume Listed', 'Transaction Verification Layer'], ans: 1, why: 'TVL (Total Value Locked) is the total capital deposited in a DeFi protocol\'s smart contracts. Higher TVL = more trust and usage.' },
      { q: 'NGL stock traded 68,235 shares today. What does high volume suggest?', opts: ['The price must have gone up', 'Strong investor interest and potential significant price movement', 'The company just listed', 'The price is stable'], ans: 1, why: 'High volume means many investors are actively trading. Combined with price movement, it signals strong conviction behind the trade.' },
      { q: 'What is slippage?', opts: ['A type of dividend', 'Price moving against you between placing and executing your order', 'A broker fee', 'When you forget your password'], ans: 1, why: 'Slippage happens when low liquidity causes your order to execute at a worse price than expected. More common in thinly-traded assets.' },
      { q: 'What does Jupiter do on Solana?', opts: ['Mines new SOL tokens', 'Aggregates DEX liquidity for best swap prices', 'Issues stablecoins', 'Validates transactions'], ans: 1, why: 'Jupiter is Solana\'s leading DEX aggregator — it finds the best swap route across all liquidity pools to get you the best price.' },
      { q: 'If 1 USD = TT$6.79, how much USD is TT$1,358?', opts: ['$9.22', '$200', '$1,358', '$922'], ans: 1, why: 'TT$1,358 ÷ 6.79 = ~$200 USD. Always convert when comparing TTSE prices (TTD) with Solana token prices (USD).' },
    ],
  },
  'quiz-4': {
    id: 'quiz-4', moduleId: 'module-4', title: 'Security & Strategy Quiz',
    passingScore: 0.7,
    questions: [
      { q: 'What is a rug pull?', opts: ['A type of DeFi strategy', 'When a project team drains funds and disappears', 'A hardware wallet feature', 'A token burning mechanism'], ans: 1, why: 'A rug pull is when developers attract investment then drain the liquidity pool and vanish. Signs: anonymous team, unrealistic APY, no audit.' },
      { q: 'You receive an unknown token in your wallet with a website URL. What should you do?', opts: ['Visit the website to claim rewards', 'Approve the token to see its value', 'Ignore it completely — it could drain your wallet', 'Send it to a friend'], ans: 2, why: 'Fake airdrops can contain malicious contracts. Approving or interacting with unknown tokens can give scammers access to drain your wallet.' },
      { q: 'What is a good rule for position sizing?', opts: ['Put 100% in the best token', 'Risk at most 1-2% of your portfolio per trade', 'Always go all-in on dips', 'Only invest in stablecoins'], ans: 1, why: 'Risking only 1-2% per trade protects you from catastrophic losses. Even professional traders follow strict position sizing rules.' },
      { q: 'Why should you diversify across TTSE and Solana?', opts: ['They are the same market', 'TTD stocks are less correlated to crypto, reducing overall risk', 'Solana tokens always go up', 'TTSE is more profitable'], ans: 1, why: 'TTSE stocks and Solana tokens have low correlation — when crypto drops, your TTD positions may hold value, and vice versa.' },
      { q: 'Where should you store your seed phrase?', opts: ['In a notes app on your phone', 'In a screenshot in cloud storage', 'On paper in a secure location', 'In a DM to yourself'], ans: 2, why: 'Write your seed phrase on paper and store it securely. Never store it digitally — phones, cloud storage, and screenshots can all be hacked.' },
    ],
  },
};
