import { Token } from '../components/TokenPriceRow';

// Generate a mock sparkline that trends in a direction
const sparkline = (trend: 'up' | 'down' | 'flat', length = 20): number[] => {
  const base = 100;
  return Array.from({ length }, (_, i) => {
    const noise = (Math.sin(i * 2.3) + Math.cos(i * 1.7)) * 3;
    const trendValue =
      trend === 'up' ? i * 2 : trend === 'down' ? -i * 2 : 0;
    return base + trendValue + noise;
  });
};

export const MOCK_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 148.32,
    change24h: 5.2,
    sparkline: sparkline('up'),
    color: '#9945FF',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 67421,
    change24h: 1.8,
    sparkline: sparkline('up'),
    color: '#F7931A',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3102,
    change24h: -2.1,
    sparkline: sparkline('down'),
    color: '#627EEA',
  },
  {
    symbol: 'LIMER',
    name: '$LIMER',
    price: 0.042,
    change24h: 12.4,
    sparkline: sparkline('up'),
    color: '#00ffa3',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.0,
    change24h: 0.0,
    sparkline: sparkline('flat'),
    color: '#2775CA',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    price: 1.12,
    change24h: 3.7,
    sparkline: sparkline('up'),
    color: '#FFCA3A',
  },
];

export const PORTFOLIO_HOLDINGS = [
  { token: 'SOL', amount: 14.62, valueUSD: 2169.68, allocation: 45 },
  { token: 'BTC', amount: 0.0179, valueUSD: 1206.83, allocation: 25 },
  { token: 'USDC', amount: 723.22, valueUSD: 723.22, allocation: 15 },
  { token: 'LIMER', amount: 11470, valueUSD: 481.74, allocation: 10 },
  { token: 'ETH', amount: 0.078, valueUSD: 241.96, allocation: 5 },
];

export const TOTAL_PORTFOLIO_USD = 4821.5;
export const PORTFOLIO_PNL_USD = 342.18;
export const PORTFOLIO_PNL_PCT = 7.6;

export const SOCIAL_PROOF = {
  users: 1247,
  nations: 30,
  lessons: 37,
  waitlist: 1,
};
