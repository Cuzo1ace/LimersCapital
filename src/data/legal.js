/* ─── Legal content: Terms of Service, Privacy Policy, Risk Disclosure ─── */

export const LEGAL_LAST_UPDATED = '2026-03-24';

export const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      body: `By accessing or using Limers Capital ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform. Limers Capital is operated by Limers Capital Ltd. ("we", "us", "our").`,
    },
    {
      heading: '2. Platform Description',
      body: `Limers Capital is a financial education and paper-trading platform built on Solana. The Platform provides:
• Educational content about decentralized finance (DeFi), liquidity provision, and Caribbean capital markets
• Simulated (paper) trading — no real money or securities are exchanged
• Market data from public sources including the Trinidad & Tobago Stock Exchange (TTSE), Solana DEX aggregators, and oracle price feeds
• Gamified learning with Limer Points (LP) and experience points (XP)
• Agent Squeeze — a liquidity pool analytics tool using publicly available Meteora data`,
    },
    {
      heading: '3. No Financial Advice',
      body: `Nothing on the Platform constitutes financial, investment, legal, or tax advice. All information is provided for educational purposes only. You should consult qualified professionals before making any investment decisions. Past performance of any asset shown on the Platform does not guarantee future results.`,
    },
    {
      heading: '4. Paper Trading Disclaimer',
      body: `All trading features on the Platform are simulated. No real assets are bought, sold, or exchanged. Paper trading results do not reflect actual market conditions, slippage, fees, or liquidity constraints. Simulated performance is not indicative of real-world trading outcomes.`,
    },
    {
      heading: '5. Eligibility',
      body: `You must be at least 18 years old to use the Platform. By using the Platform, you represent that you meet this age requirement and have the legal capacity to enter into these terms in your jurisdiction.`,
    },
    {
      heading: '6. User Accounts & Wallet Connection',
      body: `The Platform uses Solana wallet connections for authentication. You are solely responsible for the security of your wallet, private keys, and seed phrases. We never request, store, or have access to your private keys. We are not responsible for any loss resulting from unauthorized access to your wallet.`,
    },
    {
      heading: '7. Limer Points (LP) & Token Projections',
      body: `Limer Points (LP) are engagement metrics earned through Platform activities. LP accumulation does not guarantee any future token distribution, airdrop, or financial return. Any references to a future $LIMER token are forward-looking statements subject to change. We make no promises regarding the creation, value, or distribution of any token.`,
    },
    {
      heading: '8. Market Data',
      body: `Market data displayed on the Platform is sourced from third-party providers and may be delayed, incomplete, or inaccurate. We do not guarantee the accuracy, timeliness, or completeness of any data. TTSE data is provided for informational purposes only and should not be used as the sole basis for investment decisions.`,
    },
    {
      heading: '9. Intellectual Property',
      body: `All content, code, designs, and branding on the Platform are the property of Limers Capital Ltd. or its licensors. You may not copy, modify, distribute, or create derivative works without our written permission. Agent Squeeze analytics, educational content, and gamification systems are proprietary.`,
    },
    {
      heading: '10. Prohibited Conduct',
      body: `You agree not to:
• Use the Platform for any unlawful purpose
• Attempt to manipulate leaderboards, LP, or XP through automated means
• Create multiple accounts to abuse referral systems
• Scrape, crawl, or extract data from the Platform without permission
• Interfere with Platform infrastructure or security
• Misrepresent your identity or affiliation`,
    },
    {
      heading: '11. Limitation of Liability',
      body: `To the maximum extent permitted by law, Limers Capital Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability shall not exceed the amount you have paid to us in the 12 months preceding the claim, if any.`,
    },
    {
      heading: '12. Regulatory Status',
      body: `Limers Capital is an educational platform. We are not a licensed broker, dealer, exchange, or financial advisor in Trinidad & Tobago or any other jurisdiction. We are building toward alignment with the Trinidad & Tobago Securities and Exchange Commission (TTSEC) framework and Caribbean regulatory guidelines. The Platform does not facilitate the trading of real securities or digital assets until proper licensing is obtained.`,
    },
    {
      heading: '13. Modifications',
      body: `We reserve the right to modify these Terms at any time. Changes will be posted on the Platform with an updated effective date. Continued use of the Platform after changes constitutes acceptance of the revised Terms.`,
    },
    {
      heading: '14. Governing Law',
      body: `These Terms shall be governed by the laws of the Republic of Trinidad and Tobago. Any disputes arising from these Terms shall be resolved in the courts of Trinidad and Tobago.`,
    },
    {
      heading: '15. Contact',
      body: `For questions about these Terms, contact us at legal@limerscapital.com.`,
    },
  ],
};

export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  sections: [
    {
      heading: '1. Information We Collect',
      body: `We collect minimal information to operate the Platform:
• Wallet address — when you connect a Solana wallet
• Usage data — pages visited, features used, quiz completions, LP/XP earned
• Device information — browser type, operating system, screen size (via analytics)
• Referral data — referral codes used, if applicable
We do NOT collect names, email addresses, phone numbers, government IDs, or banking information.`,
    },
    {
      heading: '2. How We Use Your Information',
      body: `We use collected information to:
• Operate and improve the Platform
• Track educational progress and gamification state
• Maintain leaderboards and community features
• Analyze usage patterns to improve the user experience
• Prevent abuse and enforce our Terms of Service`,
    },
    {
      heading: '3. Data Storage',
      body: `Game state (LP, XP, quiz progress) is stored on Cloudflare Workers KV, a globally distributed key-value store. On-chain data (if you interact with our Solana programs) is stored on the Solana blockchain and is publicly visible. Local preferences may be stored in your browser's localStorage.`,
    },
    {
      heading: '4. Third-Party Services',
      body: `The Platform uses third-party services that may collect data under their own privacy policies:
• Cloudflare — infrastructure and edge computing
• PostHog — analytics (if enabled)
• Solana RPC providers — blockchain interaction
• Price data providers (Pyth, DexScreener, Jupiter, CoinGecko)
We do not sell your personal information to third parties.`,
    },
    {
      heading: '5. Data Retention',
      body: `We retain usage data for as long as necessary to provide Platform services. On-chain data is permanent and cannot be deleted due to the nature of blockchain technology. You may clear local browser data at any time.`,
    },
    {
      heading: '6. Your Rights',
      body: `You have the right to:
• Access the data we hold about you
• Request correction of inaccurate data
• Request deletion of your data (excluding on-chain records)
• Opt out of analytics tracking
Contact us at privacy@limerscapital.com to exercise these rights.`,
    },
    {
      heading: '7. Children',
      body: `The Platform is not intended for users under 18 years of age. We do not knowingly collect information from minors.`,
    },
    {
      heading: '8. Changes to This Policy',
      body: `We may update this Privacy Policy periodically. Changes will be posted on the Platform with an updated effective date.`,
    },
  ],
};

export const RISK_DISCLOSURE = {
  title: 'Risk Disclosure',
  sections: [
    {
      heading: '1. General Risk Warning',
      body: `Cryptocurrency and digital assets are highly volatile and speculative. The value of digital assets can fluctuate significantly in short periods. You could lose some or all of your investment. Only invest what you can afford to lose.`,
    },
    {
      heading: '2. Paper Trading Is Not Real Trading',
      body: `All trading on the Platform is simulated. Paper trading does not account for:
• Real market liquidity and order book depth
• Slippage, front-running, or MEV (Maximal Extractable Value)
• Actual transaction fees and gas costs
• Emotional and psychological factors of real-money trading
• Counterparty risk
Do not assume that paper trading success will translate to real-money trading success.`,
    },
    {
      heading: '3. DeFi & Liquidity Provision Risks',
      body: `Decentralized finance protocols carry unique risks including:
• Smart contract bugs or exploits
• Impermanent loss when providing liquidity
• Protocol governance attacks
• Oracle manipulation
• Rug pulls and project abandonment
Agent Squeeze provides analytics on liquidity pools but does not guarantee the safety or profitability of any pool or strategy.`,
    },
    {
      heading: '4. TTSE & Traditional Market Data',
      body: `TTSE data displayed on the Platform is for informational purposes only. Data may be delayed or inaccurate. The Platform is not affiliated with or endorsed by the Trinidad & Tobago Stock Exchange. Do not make investment decisions based solely on data shown on this Platform.`,
    },
    {
      heading: '5. Token & Airdrop Risks',
      body: `Any references to future token distributions ($LIMER) are speculative and forward-looking. Risks include:
• The token may never be created or distributed
• Token value may be zero upon launch
• Regulatory changes may prevent token issuance
• Airdrop criteria and allocations may change
• Tokens may have limited or no liquidity
LP accumulation does not create a contractual obligation for any distribution.`,
    },
    {
      heading: '6. Regulatory Uncertainty',
      body: `Cryptocurrency regulation in the Caribbean is evolving. Laws may change in ways that affect the Platform, token issuance, or digital asset trading. Users are responsible for understanding and complying with the laws of their jurisdiction.`,
    },
    {
      heading: '7. Technology Risks',
      body: `The Platform depends on Solana blockchain infrastructure, Cloudflare Workers, and third-party APIs. Service interruptions, blockchain congestion, or API failures may affect Platform availability and data accuracy.`,
    },
    {
      heading: '8. No Guarantees',
      body: `We make no guarantees regarding:
• Investment returns or trading performance
• Platform uptime or data accuracy
• Future feature availability
• Token creation, value, or distribution
• Regulatory approval or licensing
Use the Platform at your own risk.`,
    },
  ],
};

export const RISK_BANNER = {
  trade: 'This is a paper trading simulator for educational purposes only. No real assets are bought or sold. Simulated results do not reflect actual trading outcomes.',
  portfolio: 'This portfolio tracks simulated paper trades only. Holdings shown are not real assets. Do not use this as a basis for real investment decisions.',
};
