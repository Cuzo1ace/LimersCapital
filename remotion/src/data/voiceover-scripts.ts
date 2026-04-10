/**
 * Voiceover scripts for Limer's Capital demo video.
 * Three variants: (A) full AI voiceover, (B) music + captions only, (C) silent with timing markers.
 *
 * Each line is timed to a scene. The AI generator creates one MP3 per line.
 */

export interface VOLine {
  id: string;            // unique identifier (used as filename)
  sceneId: string;       // which scene this line belongs to
  text: string;          // text to speak / caption
  startFrameOffset?: number; // optional delay within scene (frames)
}

// ─── Walkthrough (2:30) — full narrative ──────────────────────────────
export const WALKTHROUGH_SCRIPT: VOLine[] = [
  { id: 'w01-coldopen',  sceneId: 'coldOpen',     text: "Limer's Capital." },
  { id: 'w02-map',       sceneId: 'caribbeanMap', text: "Twenty-two Caribbean nations. Mapped. Monitored. United." },
  { id: 'w03-hook',      sceneId: 'hook',         text: "The Caribbean's first DeFi platform — built on Solana." },
  { id: 'w04-hero',      sceneId: 'hero',         text: "Learn crypto. Trade smart. Earn $LIMER. From zero to DeFi — education, paper trading, and real rewards." },
  { id: 'w05-problem',   sceneId: 'problem',      text: "Thirty-plus Caribbean nations. Billions in remittances. And zero native DeFi platforms — until now." },
  { id: 'w06-learn',     sceneId: 'learn',        text: "Master crypto from zero. Interactive lessons, quizzes, and real rewards for every concept you unlock." },
  { id: 'w07-trade',     sceneId: 'trade',        text: "Paper trade with a hundred thousand virtual dollars. Real prices, zero risk — the perfect place to practice." },
  { id: 'w08-market',    sceneId: 'market',       text: "Every Solana token. One clean feed. Live prices, sparklines, and depth — all in one place." },
  { id: 'w09-portfolio', sceneId: 'portfolio',    text: "Track every position. Watch your portfolio grow with real-time P&L and allocation insights." },
  { id: 'w10-earn',      sceneId: 'earn',         text: "Earn LIMER Points just by using the app. Learn, trade, stay consistent — your points become tokens when we launch." },
  { id: 'w11-bottomnav', sceneId: 'bottomNav',    text: "Built mobile-first. Native app feel. Full web access. Your pocket, your portfolio." },
  { id: 'w12-cta',       sceneId: 'cta',          text: "Learn crypto. Trade smart. Earn LIMER. Join the Caribbean DeFi revolution at limerscapital.com." },
];

// ─── Colosseum 75s — judge-facing pitch ────────────────────────────────
export const COLOSSEUM_SCRIPT: VOLine[] = [
  { id: 'c01-coldopen',  sceneId: 'coldOpen',     text: "Limer's Capital." },
  { id: 'c02-map',       sceneId: 'caribbeanMap', text: "Twenty-two Caribbean nations. One unified DeFi platform." },
  { id: 'c03-hook',      sceneId: 'hook',         text: "The Caribbean's first DeFi platform, built on Solana." },
  { id: 'c04-hero',      sceneId: 'hero',         text: "We're making crypto accessible to thirty million Caribbean users — through education, practice, and rewards." },
  { id: 'c05-problem',   sceneId: 'problem',      text: "Thirty-plus nations. Billions in remittances. Zero native DeFi. This is the opportunity." },
  { id: 'c06-learn',     sceneId: 'learn',        text: "Users start by learning. Bite-sized lessons on wallets, DeFi, and Solana — gamified with points and streaks." },
  { id: 'c07-trade',     sceneId: 'trade',        text: "Then they paper trade with a virtual hundred thousand dollars. Real-time Solana prices. Zero risk." },
  { id: 'c08-portfolio', sceneId: 'portfolio',    text: "They track portfolios, compete on leaderboards, and earn LIMER Points with every action." },
  { id: 'c09-earn',      sceneId: 'earn',         text: "Those points convert to tokens at launch — aligning incentives with every user we bring in." },
  { id: 'c10-cta',       sceneId: 'cta',          text: "Built on Solana. Made in the Caribbean. Limers Capital dot com." },
];

// ─── Social 20s — punchy hook ─────────────────────────────────────────
export const SOCIAL_SCRIPT: VOLine[] = [
  { id: 's01-hook',     sceneId: 'hook',     text: "The Caribbean's first DeFi platform is here." },
  { id: 's02-hero',     sceneId: 'hero',     text: "Learn crypto. Trade with a virtual hundred thousand. Earn real LIMER." },
  { id: 's03-highlight',sceneId: 'highlight',text: "Zero risk. Zero gatekeeping. All upside." },
  { id: 's04-cta',      sceneId: 'cta',      text: "Limers Capital dot com." },
];

// ─── Landing loop (45s) — no narration, just cinematic ─────────────────
export const LANDING_SCRIPT: VOLine[] = [];

// ElevenLabs voice IDs — premade voices available on free tier.
// Matilda: "Knowledgable, Professional" — perfect for fintech/education pitch.
// Swap to any of these if you want a different vibe:
//   - JBFqnCBsd6RMkjVDRZzb  George   — "Warm, Captivating Storyteller"
//   - cjVigY5qzO86Huf0OWal  Eric     — "Smooth, Trustworthy"
//   - hpp4J3VqNfWAUOO0d1Us  Bella    — "Professional, Bright, Warm"
//   - Xb7hH8MSUJpSbSDYk0k2  Alice    — "Clear, Engaging Educator"
//   - bIHbv24MWmeRgasZH58o  Will     — "Relaxed Optimist" (Caribbean vibe)
export const VOICE_IDS = {
  narrator: 'XrExE9yKIg1WjnnlVkGX', // Matilda — knowledgable, professional
} as const;

export const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.8,
  style: 0.25,
  use_speaker_boost: true,
} as const;
