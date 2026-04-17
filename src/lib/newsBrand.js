/**
 * Source → brand-accented tile config.
 *
 * Most news_items rows have no hero_image (RSS feeds rarely bundle media).
 * Rather than render broken/empty tiles, we give each source a gradient
 * backdrop + emoji glyph so the feed reads as visual, not just text-in-a-box.
 *
 * Usage:
 *   const brand = getSourceBrand(item.source_name);
 *   // → { gradient: 'linear-gradient(...)', glyph: '⚡', accent: '#9945FF' }
 */

const BRANDS = {
  'SolanaFloor': {
    accent: '#9945FF',
    glyph: '⚡',
    gradient: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  },
  'Solana Foundation': {
    accent: '#14F195',
    glyph: '◎',
    gradient: 'linear-gradient(135deg, #14F195 0%, #0B84FF 100%)',
  },
  'Solana Foundation blog': {
    accent: '#14F195',
    glyph: '◎',
    gradient: 'linear-gradient(135deg, #14F195 0%, #0B84FF 100%)',
  },
  'CoinDesk — headlines': {
    accent: '#F5A623',
    glyph: '📰',
    gradient: 'linear-gradient(135deg, #232323 0%, #F5A623 100%)',
  },
  'Colosseum blog': {
    accent: '#FF6B35',
    glyph: '🏟️',
    gradient: 'linear-gradient(135deg, #2D1B69 0%, #FF6B35 100%)',
  },
  'Colosseum Hackathon': {
    accent: '#FF6B35',
    glyph: '🏆',
    gradient: 'linear-gradient(135deg, #2D1B69 0%, #FF6B35 100%)',
  },
  'Solflare — news': {
    accent: '#FE7B1E',
    glyph: '🔥',
    gradient: 'linear-gradient(135deg, #101010 0%, #FE7B1E 100%)',
  },
  "Limer's Capital": {
    accent: '#00ffa3',
    glyph: '🍋',
    gradient: 'linear-gradient(135deg, #0d0e10 0%, #00ffa3 100%)',
  },
  'Solana 101': {
    accent: '#14F195',
    glyph: '📚',
    gradient: 'linear-gradient(135deg, #0d0e10 0%, #14F195 100%)',
  },
  'Regional roundup': {
    accent: '#FFCA3A',
    glyph: '🌴',
    gradient: 'linear-gradient(135deg, #00667A 0%, #FFCA3A 100%)',
  },
  'ViFi': {
    accent: '#00BCD4',
    glyph: '🌊',
    gradient: 'linear-gradient(135deg, #0d0e10 0%, #00BCD4 100%)',
  },
};

const FALLBACK = {
  accent: '#ababad',
  glyph: '📄',
  gradient: 'linear-gradient(135deg, #1e2022 0%, #47484a 100%)',
};

export function getSourceBrand(sourceName) {
  if (!sourceName) return FALLBACK;
  return BRANDS[sourceName] || FALLBACK;
}

/**
 * Render-ready props for a placeholder tile.
 * Accepts optional priority for subtle sizing cues.
 */
export function placeholderStyle(sourceName) {
  const b = getSourceBrand(sourceName);
  return {
    background: b.gradient,
    '--accent': b.accent,
  };
}
