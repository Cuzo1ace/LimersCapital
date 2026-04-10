/**
 * Limer's Capital — Pitch Deck v2 Builder
 * ----------------------------------------
 * Generates a comprehensive 18-slide investor / Colosseum-judge pitch deck
 * synthesizing the Centennial Evolution Model, Survival Probability Analysis,
 * and current platform state.
 *
 * Run: node scripts/build-pitch-deck-v2.js
 * Output: Limers-Capital-Pitch-Deck-v2.pptx (project root)
 */

const path = require('path');
const fs = require('fs');

// Resolve pptxgenjs from global install
const globalNodeModules = '/Users/ace369/.npm-global/lib/node_modules';
const pptxgen = require(path.join(globalNodeModules, 'pptxgenjs'));

// ── Brand Tokens ──────────────────────────────────────────────────
const C = {
  night:  '0D0E10',
  night2: '121316',
  night3: '1E2022',
  sea:    '00FFA3',
  seaDk:  '00EF99',
  coral:  'BF81FF',
  sun:    'FFCA3A',
  palm:   '2D9B56',
  down:   'FF716C',
  txt:    'FDFBFE',
  txt2:   'ABABAD',
  muted:  '6B6C6E',
  border: '47484A',
};

const F = {
  headline: 'Helvetica Neue', // closest cross-platform Space Grotesk equivalent
  body:     'Helvetica',
  mono:     'Courier New',
};

// ── Setup ─────────────────────────────────────────────────────────
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10" × 5.625"
pres.author = "Limer's Capital";
pres.title  = "Limer's Capital — Pitch Deck v2 (April 2026)";
pres.company = "Limer's Capital";
pres.subject = "Caribbean DeFi on Solana — Centennial Vision + Current State";

// Layout helpers
const W = 10, H = 5.625;
const margin = 0.5;

// ── Reusable elements ────────────────────────────────────────────
function darkBg(slide) {
  slide.background = { color: C.night };
  // Subtle ambient gradient blob top-left
  slide.addShape(pres.shapes.OVAL, {
    x: -2, y: -2, w: 5, h: 5,
    fill: { color: C.sea, transparency: 95 },
    line: { color: C.sea, width: 0, transparency: 100 },
  });
  // And bottom-right
  slide.addShape(pres.shapes.OVAL, {
    x: 7.5, y: 3.5, w: 4, h: 4,
    fill: { color: C.coral, transparency: 96 },
    line: { color: C.coral, width: 0, transparency: 100 },
  });
}

// Footer y = 5.35 (very bottom). Content must end at y < 5.05 to leave clearance.
const FOOTER_Y = 5.35;
const MAX_CONTENT_Y = 5.05;

function pageNumber(slide, n, total) {
  slide.addText(`${String(n).padStart(2, '0')} / ${total}`, {
    x: W - 1.2, y: FOOTER_Y, w: 1, h: 0.25,
    fontSize: 8, fontFace: F.mono, color: C.muted, align: 'right', margin: 0,
  });
}

function brandFooter(slide) {
  slide.addText("Limer's Capital · limerscapital.com", {
    x: 0.5, y: FOOTER_Y, w: 5, h: 0.25,
    fontSize: 8, fontFace: F.mono, color: C.muted, align: 'left', margin: 0,
  });
}

function sparkle(slide, x, y, size = 0.35) {
  // Simple 4-point star using a diamond shape recolored
  slide.addText('✦', {
    x, y, w: size, h: size,
    fontSize: size * 50, fontFace: F.headline, color: C.sea,
    align: 'center', valign: 'middle', margin: 0,
    bold: true,
  });
}

function eyebrow(slide, text, x = margin, y = 0.4) {
  slide.addText(text, {
    x, y, w: W - 2 * margin, h: 0.3,
    fontSize: 11, fontFace: F.mono, color: C.sea,
    bold: true, margin: 0, charSpacing: 4,
  });
}

function title(slide, text, x = margin, y = 0.85, w = W - 2 * margin, h = 1.2, color = C.txt) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: 36, fontFace: F.headline, color, bold: true,
    align: 'left', valign: 'top', margin: 0,
  });
}

function subtitle(slide, text, x = margin, y = 1.95, w = W - 2 * margin, h = 0.5) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: 16, fontFace: F.body, color: C.txt2,
    align: 'left', valign: 'top', margin: 0,
  });
}

function statCard(slide, x, y, w, h, opts) {
  // Card background
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.night2 },
    line: { color: C.border, width: 0.75 },
  });
  // Eyebrow
  if (opts.label) {
    slide.addText(opts.label, {
      x: x + 0.2, y: y + 0.18, w: w - 0.4, h: 0.25,
      fontSize: 9, fontFace: F.mono, color: C.txt2, bold: true, charSpacing: 2, margin: 0,
    });
  }
  // Big number
  slide.addText(opts.value, {
    x: x + 0.2, y: y + 0.5, w: w - 0.4, h: 0.9,
    fontSize: opts.valueSize || 38, fontFace: F.headline, color: opts.color || C.sea,
    bold: true, align: 'left', valign: 'top', margin: 0,
  });
  // Caption
  if (opts.caption) {
    slide.addText(opts.caption, {
      x: x + 0.2, y: y + h - 0.5, w: w - 0.4, h: 0.4,
      fontSize: 10, fontFace: F.body, color: C.txt2, margin: 0,
    });
  }
}

const TOTAL = 18;

// ═══════════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);

  // Big sparkle ornament
  slide.addText('✦', {
    x: 0, y: 1.0, w: W, h: 0.8,
    fontSize: 60, fontFace: F.headline, color: C.sea,
    align: 'center', valign: 'middle', margin: 0, bold: true,
  });

  // Logo wordmark
  slide.addText("Limer's Capital", {
    x: 0, y: 1.85, w: W, h: 1.0,
    fontSize: 56, fontFace: F.headline, color: C.txt,
    bold: true, align: 'center', valign: 'middle', margin: 0,
    charSpacing: -1,
  });

  // Tagline (gradient feel via colored runs)
  slide.addText([
    { text: "Caribbean DeFi.",  options: { color: C.sea } },
    { text: " Reimagined.",     options: { color: C.coral } },
  ], {
    x: 0, y: 2.95, w: W, h: 0.6,
    fontSize: 24, fontFace: F.headline, italic: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Subtitle
  slide.addText("The Caribbean's first DeFi education and trading platform — built on Solana", {
    x: 0.5, y: 3.7, w: 9, h: 0.4,
    fontSize: 14, fontFace: F.body, color: C.txt2, align: 'center', margin: 0,
  });

  // Footer line
  slide.addText("Pitch Deck v2 · April 2026 · limerscapital.com", {
    x: 0, y: 5.05, w: W, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.muted, align: 'center', margin: 0, charSpacing: 2,
  });

  // Bottom accent line
  slide.addShape(pres.shapes.LINE, {
    x: 4.0, y: 4.45, w: 2.0, h: 0,
    line: { color: C.sea, width: 1.5 },
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 2 — THE PROBLEM
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '01 · THE PROBLEM');
  title(slide, 'A region locked out of\nthe future of finance.');

  // 4 stat cards in a 2x2 grid (2 rows × 1.2H + gap = 2.55, fits 2.5 → 5.05)
  const cardW = 4.4, cardH = 1.2, gap = 0.15;
  const startX = 0.5, startY = 2.5;

  statCard(slide, startX,                      startY,                        cardW, cardH, {
    label: 'CARIBBEAN + LATAM POPULATION', value: '700M', color: C.sea,
    caption: 'Underserved by global crypto exchanges',
  });
  statCard(slide, startX + cardW + gap,        startY,                        cardW, cardH, {
    label: 'WHO HAVE TOUCHED A WALLET', value: '< 4%', color: C.down,
    caption: 'Compared to ~16% global average',
  });
  statCard(slide, startX,                      startY + cardH + gap,          cardW, cardH, {
    label: 'ANNUAL CARIBBEAN REMITTANCES', value: '$20B+', color: C.sun,
    caption: 'At ~7% average cost — billions wasted',
  });
  statCard(slide, startX + cardW + gap,        startY + cardH + gap,          cardW, cardH, {
    label: 'NATIVE DEFI PLATFORMS', value: '0', color: C.coral,
    caption: 'Targeting the 22 Caribbean nations',
  });

  brandFooter(slide);
  pageNumber(slide, 2, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 3 — THE VISION
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '02 · THE VISION');
  title(slide, 'A 100-year institution\nfor the Caribbean.');
  subtitle(slide, 'Not a hackathon project. Not a quarterly product cycle. A multi-generational platform that evolves through six distinct economic eras across the next century.');

  // Two-column "from → to" — taller boxes filling more vertical space
  const colY = 2.6, colW = 4.4, colH = 2.4;

  // FROM
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
  });
  slide.addText('TODAY', {
    x: 0.7, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.txt2, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: "An education-first DeFi platform with paper trading,", options: { breakLine: true } },
    { text: "live Solana swaps, and 22-jurisdiction regulatory mapping.", options: {} },
  ], {
    x: 0.7, y: colY + 0.55, w: colW - 0.4, h: 1.4,
    fontSize: 13, fontFace: F.body, color: C.txt, valign: 'top', margin: 0,
  });

  // Arrow
  slide.addText('→', {
    x: colW + 0.5, y: colY + 0.5, w: 0.6, h: 1.0,
    fontSize: 40, fontFace: F.headline, color: C.sea,
    align: 'center', valign: 'middle', bold: true, margin: 0,
  });

  // TO
  slide.addShape(pres.shapes.RECTANGLE, {
    x: colW + 1.1, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1.0 },
  });
  slide.addText('BY 2126', {
    x: colW + 1.3, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: "The financial infrastructure of the Caribbean —", options: { breakLine: true } },
    { text: "a regulated utility powering remittances, securities,", options: { breakLine: true } },
    { text: "CBDC interop, and Universal Basic Ownership.", options: {} },
  ], {
    x: colW + 1.3, y: colY + 0.55, w: colW - 0.4, h: 1.4,
    fontSize: 13, fontFace: F.body, color: C.txt, valign: 'top', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 3, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 4 — THE FUNNEL: LEARN → TRADE → EARN → GROW
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '03 · THE PRODUCT');
  title(slide, 'Learn. Trade. Earn. Grow.');
  subtitle(slide, "The narrative escalator: from your first wallet to ownership of the region's financial future.");

  // 4 cards in a single row
  const cardW = 2.15, cardH = 2.15, gap = 0.15;
  const startX = 0.5, startY = 2.95;
  const cards = [
    { title: 'LEARN',  body: '8 modules · 37 lessons · 8 quizzes. From wallets to advanced LP strategies.', color: C.sea },
    { title: 'TRADE',  body: 'Paper trade $100K virtual. 14 Solana tokens + 30 TTSE stocks + perpetuals.', color: C.coral },
    { title: 'EARN',   body: '$LIMER points convert to tokens at launch. 25 badges, 10-tier XP, streaks.', color: C.sun },
    { title: 'GROW',   body: 'Tokenized Caribbean RWAs. Universal Basic Ownership for every islander.', color: C.palm },
  ];

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    // Color accent bar (top)
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: 0.08,
      fill: { color: card.color }, line: { color: card.color, width: 0 },
    });
    // Number
    slide.addText(`0${i + 1}`, {
      x: x + 0.2, y: startY + 0.25, w: cardW - 0.4, h: 0.4,
      fontSize: 12, fontFace: F.mono, color: C.txt2, bold: true, margin: 0,
    });
    // Title
    slide.addText(card.title, {
      x: x + 0.2, y: startY + 0.65, w: cardW - 0.4, h: 0.5,
      fontSize: 22, fontFace: F.headline, color: card.color, bold: true, margin: 0,
    });
    // Body
    slide.addText(card.body, {
      x: x + 0.2, y: startY + 1.2, w: cardW - 0.4, h: 0.85,
      fontSize: 10, fontFace: F.body, color: C.txt, valign: 'top', margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 4, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 5 — WHAT'S LIVE TODAY
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '04 · TRACTION');
  title(slide, "Production-grade.\nNot a prototype.");

  // 6 stat callouts in a 3x2 grid
  const cardW = 2.95, cardH = 1.05, gap = 0.15;
  const startX = 0.5, startY = 2.55;
  const stats = [
    { value: '19',   label: 'PAGES',                color: C.sea },
    { value: '8',    label: 'EDU MODULES',          color: C.coral },
    { value: '37',   label: 'LESSONS',              color: C.sun },
    { value: '361',  label: 'TESTS PASSING',        color: C.sea },
    { value: '22',   label: 'JURISDICTIONS MAPPED', color: C.coral },
    { value: '14+30',label: 'TOKENS + TTSE STOCKS', color: C.sun },
  ];

  stats.forEach((s, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: cardH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    slide.addText(s.value, {
      x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.55,
      fontSize: 32, fontFace: F.headline, color: s.color, bold: true, margin: 0,
    });
    slide.addText(s.label, {
      x: x + 0.2, y: y + 0.7, w: cardW - 0.4, h: 0.3,
      fontSize: 9, fontFace: F.mono, color: C.txt2, bold: true, charSpacing: 2, margin: 0,
    });
  });

  // Subtitle below the grid
  slide.addText("Real Jupiter V6 swaps · Solflare/Phantom wallet integration · On-chain profiles · PWA · i18n in 3 languages · Cloudflare Worker API proxy · Vitest + Playwright tests", {
    x: 0.5, y: 4.95, w: 9, h: 0.4,
    fontSize: 10, fontFace: F.body, color: C.txt2, italic: true, align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 5, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 6 — THE CARIBBEAN WHITESPACE
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '05 · COMPETITIVE POSITION');
  title(slide, 'A whitespace no one else sees.');

  // Big A- grade callout (narrower, leaves more room for right column)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.6, w: 3.0, h: 2.4,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });
  slide.addText('A−', {
    x: 0.5, y: 2.75, w: 3.0, h: 1.3,
    fontSize: 84, fontFace: F.headline, color: C.sea, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText('GRADE', {
    x: 0.5, y: 4.0, w: 3.0, h: 0.25,
    fontSize: 10, fontFace: F.mono, color: C.txt2, bold: true,
    align: 'center', charSpacing: 4, margin: 0,
  });
  slide.addText('Top 5% uniqueness across\n5,400+ Colosseum projects', {
    x: 0.5, y: 4.3, w: 3.0, h: 0.6,
    fontSize: 10, fontFace: F.body, color: C.txt2,
    align: 'center', margin: 0,
  });

  // Right side: 4 differentiators (wider, more breathing room)
  const diffs = [
    { label: 'CARIBBEAN-SPECIFIC',    text: '0 of 5,400+ Colosseum projects target the region. Complete whitespace.' },
    { label: 'CROSS-CLUSTER',         text: 'Only project bridging "Gamified Education" + "Gamified Trading".' },
    { label: 'REGULATORY MAP',        text: '22-jurisdiction VASP / CBDC / DARE Act tracker. Nothing comparable.' },
    { label: 'EDUCATION + EXECUTION', text: 'Learn → Practice → Execute pipeline. Competitors do one, never all.' },
  ];

  const dStartX = 3.7, dStartY = 2.6, dW = 5.8, dH = 0.55, dGap = 0.07;
  diffs.forEach((d, i) => {
    const y = dStartY + i * (dH + dGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: dStartX, y, w: dW, h: dH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: dStartX, y, w: 0.06, h: dH,
      fill: { color: C.coral }, line: { color: C.coral, width: 0 },
    });
    slide.addText(d.label, {
      x: dStartX + 0.2, y: y + 0.08, w: dW - 0.3, h: 0.22,
      fontSize: 9, fontFace: F.mono, color: C.coral, bold: true, charSpacing: 2, margin: 0,
    });
    slide.addText(d.text, {
      x: dStartX + 0.2, y: y + 0.28, w: dW - 0.3, h: 0.3,
      fontSize: 10.5, fontFace: F.body, color: C.txt, margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 6, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 7 — THE CENTENNIAL EVOLUTION MODEL (Overview)
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '06 · THE 100-YEAR FRAMEWORK');
  title(slide, 'The Centennial Evolution Model');
  subtitle(slide, 'Limer\'s as a dissipative structure (Prigogine, 1977) — analyzed across 5 disciplines: physics, economics, sociology, data science, software engineering.');

  // Era timeline as 6 boxes in a row — short labels to avoid mid-word breaks
  const eras = [
    { num: 'I',   name: 'NUCLEATION',     years: '2026—33', color: C.sea },
    { num: 'II',  name: 'CRYSTALLIZE',    years: '2033—45', color: C.seaDk },
    { num: 'III', name: 'DIASPORA',       years: '2045—65', color: C.sun },
    { num: 'IV',  name: 'SOVEREIGN',      years: '2065—85', color: C.palm },
    { num: 'V',   name: 'GENERATIONAL',   years: '2085—2110', color: C.coral },
    { num: 'VI',  name: 'POST-PLATFORM',  years: '2110—26', color: C.muted },
  ];

  const eraW = 1.5, eraH = 2.2, eraGap = 0.07;
  const eraStartX = 0.45, eraStartY = 2.7;

  eras.forEach((era, i) => {
    const x = eraStartX + i * (eraW + eraGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: eraStartY, w: eraW, h: eraH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: eraStartY, w: eraW, h: 0.08,
      fill: { color: era.color }, line: { color: era.color, width: 0 },
    });
    slide.addText(`ERA ${era.num}`, {
      x: x + 0.1, y: eraStartY + 0.25, w: eraW - 0.2, h: 0.3,
      fontSize: 9, fontFace: F.mono, color: era.color, bold: true, charSpacing: 2, margin: 0,
    });
    slide.addText(era.name, {
      x: x + 0.05, y: eraStartY + 0.65, w: eraW - 0.1, h: 1.0,
      fontSize: 10, fontFace: F.headline, color: C.txt, bold: true,
      align: 'center', valign: 'top', margin: 0,
    });
    slide.addText(era.years, {
      x: x + 0.05, y: eraStartY + 1.7, w: eraW - 0.1, h: 0.3,
      fontSize: 9, fontFace: F.mono, color: C.txt2,
      align: 'center', margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 7, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 8 — ERA I: NUCLEATION
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '07 · WE ARE HERE');
  title(slide, 'Era I: Nucleation\n(2026-2033)');

  // Two columns
  const colW = 4.4, colY = 2.8, colH = 2.4;

  // LEFT: Critical Radius math callout
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
  });
  slide.addText('THE NUCLEATION BARRIER', {
    x: 0.7, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText('r* = -2γ / Δgᵥ', {
    x: 0.7, y: colY + 0.55, w: colW - 0.4, h: 0.5,
    fontSize: 24, fontFace: F.mono, color: C.coral, bold: true, margin: 0,
  });
  slide.addText([
    { text: 'γ',      options: { color: C.sea } },
    { text: ' = $6K/mo fixed costs', options: { color: C.txt, breakLine: true } },
    { text: 'Δgᵥ',    options: { color: C.sea } },
    { text: ' = $5/mo net value per user', options: { color: C.txt, breakLine: true } },
    { text: 'r*',     options: { color: C.sea } },
    { text: ' ≈ 2,400 MAU minimum', options: { color: C.txt } },
  ], {
    x: 0.7, y: colY + 1.15, w: colW - 0.4, h: 1.0,
    fontSize: 13, fontFace: F.body, valign: 'top', margin: 0,
  });

  // RIGHT: Goals
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
  });
  slide.addText('ERA I OBJECTIVES', {
    x: 5.3, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.sun, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: 'Reach 100K MAU before treasury depletes', options: { bullet: { code: '25CB' }, color: C.txt, breakLine: true } },
    { text: 'Solve solo-founder problem in 24 months',  options: { bullet: { code: '25CB' }, color: C.txt, breakLine: true } },
    { text: 'Regulatory licenses in 3+ jurisdictions', options: { bullet: { code: '25CB' }, color: C.txt, breakLine: true } },
    { text: 'University partnerships (UWI, UTT, UTech)',options: { bullet: { code: '25CB' }, color: C.txt, breakLine: true } },
    { text: 'Maintain modular architecture',           options: { bullet: { code: '25CB' }, color: C.txt } },
  ], {
    x: 5.3, y: colY + 0.55, w: colW - 0.4, h: 1.8,
    fontSize: 13, fontFace: F.body, valign: 'top', paraSpaceAfter: 4, margin: 0,
  });

  // Bottom: revenue trajectory (within MAX_CONTENT_Y)
  slide.addText('PROJECTED: 450K MAU · $35M ARR by 2033', {
    x: 0.5, y: 4.85, w: 9, h: 0.25,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 2,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 8, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 9 — ERA II: CRYSTALLIZATION
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '08 · ERA II');
  title(slide, 'Crystallization (2033-2045)');
  subtitle(slide, 'Education platform → Caribbean financial super-app. Network effect enters superlinear regime as new jurisdictions activate bipartite diaspora corridors.');

  // 4 product verticals in a row
  const cardW = 2.2, cardH = 1.7, gap = 0.13;
  const startX = 0.5, startY = 2.85;
  const products = [
    { num: '01', title: 'REMITTANCE',   body: '$18.4B Caribbean corridor at 1-2% (vs 7.1%).', color: C.sea },
    { num: '02', title: 'TOKEN RWA',    body: 'TTSE stocks, real estate, bonds via T&T SEC.', color: C.coral },
    { num: '03', title: 'CBDC INTEROP', body: "Sand Dollar, JAM-DEX, DCash bridged.", color: C.sun },
    { num: '04', title: 'MICRO-LEND',   body: 'TTD/XCD/JMD loans collateralized by LP pools.', color: C.palm },
  ];
  products.forEach((p, i) => {
    const x = startX + i * (cardW + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: 0.06, h: cardH,
      fill: { color: p.color }, line: { color: p.color, width: 0 },
    });
    slide.addText(p.num, {
      x: x + 0.18, y: startY + 0.18, w: cardW - 0.3, h: 0.25,
      fontSize: 9, fontFace: F.mono, color: C.txt2, bold: true, margin: 0,
    });
    slide.addText(p.title, {
      x: x + 0.18, y: startY + 0.45, w: cardW - 0.3, h: 0.4,
      fontSize: 14, fontFace: F.headline, color: p.color, bold: true, margin: 0,
    });
    slide.addText(p.body, {
      x: x + 0.18, y: startY + 0.9, w: cardW - 0.3, h: 0.9,
      fontSize: 10, fontFace: F.body, color: C.txt, valign: 'top', margin: 0,
    });
  });

  // Footer projection (within MAX_CONTENT_Y)
  slide.addText('TARGET 2045: 1.8M MAU · $180M ARR · 15+ jurisdictions · $900M remittance vol', {
    x: 0.5, y: 4.75, w: 9, h: 0.25,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 1,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 9, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 10 — ERAS III + IV-VI (combined long horizon)
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '09 · THE LONG HORIZON');
  title(slide, 'Diaspora Engine →\nSovereign Infrastructure.');

  // Stacked timeline blocks
  const items = [
    {
      tag: 'ERA III · 2045-2065', name: 'Diaspora Engine', color: C.sun,
      body: 'Limer\'s becomes financial rails, not a platform. 22 jurisdictions linked. Brooklyn ↔ Kingston. 5.2M MAU. $800M ARR.',
    },
    {
      tag: 'ERA IV · 2065-2085', name: 'Sovereign Infrastructure', color: C.palm,
      body: 'Caribbean governments use Limer\'s for CBDC distribution + securities settlement. Climate finance instruments. Regulated utility status. $1.5B ARR.',
    },
    {
      tag: 'ERA V · 2085-2110', name: 'Generational Continuity', color: C.coral,
      body: 'Third-generation users have no memory of life before Limer\'s. Foundation + Operating Co + DAO governance. Quasi-sovereign wealth instrument for the Caribbean diaspora. $2.2B ARR.',
    },
    {
      tag: 'ERA VI · 2110-2126', name: 'Post-Platform Equilibrium', color: C.muted,
      body: '40% protocol permanence (TCP/IP-style public good) · 35% institutional evolution (Caribbean JPMorgan) · 25% creative destruction. $2.8B ARR (~$800M in 2026 dollars).',
    },
  ];

  // 4 rows × 0.55 + 3 gaps × 0.08 = 2.44 height. Start at 2.55, ends at 4.99 ✓
  const itemH = 0.55, itemGap = 0.08;
  const itemStartY = 2.55;

  items.forEach((item, i) => {
    const y = itemStartY + i * (itemH + itemGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: itemH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.06, h: itemH,
      fill: { color: item.color }, line: { color: item.color, width: 0 },
    });
    slide.addText(item.tag, {
      x: 0.7, y: y + 0.06, w: 2.2, h: 0.2,
      fontSize: 8, fontFace: F.mono, color: item.color, bold: true, charSpacing: 1, margin: 0,
    });
    slide.addText(item.name, {
      x: 2.95, y: y + 0.06, w: 2.5, h: 0.25,
      fontSize: 12, fontFace: F.headline, color: C.txt, bold: true, margin: 0,
    });
    slide.addText(item.body, {
      x: 0.7, y: y + 0.28, w: 8.7, h: 0.28,
      fontSize: 9, fontFace: F.body, color: C.txt2, margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 10, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 11 — THE CENTENNIAL EQUATION
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '10 · THE MATH OF SURVIVAL');
  title(slide, 'P(100) = 10% → 29%');

  // Equation callout (centered)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 2.45, w: 7, h: 1.0,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });
  slide.addText('P(T) = e^(−λT) × (1 + αT)^β', {
    x: 1.5, y: 2.55, w: 7, h: 0.8,
    fontSize: 28, fontFace: F.mono, color: C.sea, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Three parameters in columns
  const pY = 3.55, pH = 1.35;
  const params = [
    { sym: 'λ', name: 'BASE MORTALITY',     from: '0.030', to: '0.022', color: C.sea,
      detail: '−27% via multi-sig succession,\nuniversity partnerships,\nchain abstraction' },
    { sym: 'α', name: 'ANTIFRAGILITY',      from: '0.008', to: '0.012', color: C.coral,
      detail: '+50% via volatility\nharvesting treasury +\nopen-source protocol' },
    { sym: 'β', name: 'GOVERNANCE QUALITY', from: '1.20',  to: '1.50',  color: C.sun,
      detail: '+25% via Protocol Charter +\nAdvisory Council +\nCommunity Validators' },
  ];
  const pW = 2.95, pGap = 0.18;
  const pStartX = 0.5;
  params.forEach((p, i) => {
    const x = pStartX + i * (pW + pGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: pY, w: pW, h: pH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    slide.addText(p.sym, {
      x: x + 0.2, y: pY + 0.1, w: 0.6, h: 0.5,
      fontSize: 32, fontFace: F.mono, color: p.color, bold: true, margin: 0,
    });
    slide.addText(p.name, {
      x: x + 0.85, y: pY + 0.18, w: pW - 0.95, h: 0.25,
      fontSize: 9, fontFace: F.mono, color: p.color, bold: true, charSpacing: 1, margin: 0,
    });
    slide.addText([
      { text: p.from, options: { color: C.txt2 } },
      { text: ' → ', options: { color: C.txt2 } },
      { text: p.to,   options: { color: C.txt, bold: true } },
    ], {
      x: x + 0.85, y: pY + 0.42, w: pW - 0.95, h: 0.3,
      fontSize: 13, fontFace: F.mono, margin: 0,
    });
    slide.addText(p.detail, {
      x: x + 0.2, y: pY + 0.78, w: pW - 0.4, h: 0.6,
      fontSize: 9, fontFace: F.body, color: C.txt2, margin: 0,
    });
  });

  // Bottom result (within MAX_CONTENT_Y)
  slide.addText("Result: ~3× improvement in centennial survival probability.", {
    x: 0.5, y: 5.0, w: 9, h: 0.25,
    fontSize: 10, fontFace: F.body, color: C.sea, italic: true, bold: true,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 11, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 12 — THE 8 INTERVENTIONS
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '11 · THE 8 INTERVENTIONS');
  title(slide, 'Most cost zero dollars.');

  const interventions = [
    { num: '1', name: 'Squads Multi-Sig + Shamir Succession', cost: 'FREE',  param: 'λ −0.003' },
    { num: '2', name: 'Operations Documentation Sprint',      cost: 'FREE',  param: 'λ −0.001' },
    { num: '3', name: 'Cut Critical Radius (lower γ)',        cost: 'FREE',  param: 'λ −0.003' },
    { num: '4', name: 'Caribbean University Partnerships',    cost: 'FREE',  param: 'λ −0.002' },
    { num: '5', name: 'Chain Abstraction Layer',              cost: 'FREE',  param: 'λ −0.001' },
    { num: '6', name: 'Second Jurisdiction (Bermuda/Cayman)', cost: '$5-50K', param: 'λ −0.001' },
    { num: '7', name: 'Antifragile Treasury (vol harvest)',   cost: '7.5M tokens', param: 'α +0.002' },
    { num: '8', name: 'Open-Source Core Protocol',            cost: 'FREE',  param: 'α +0.002' },
  ];

  // 4x2 grid: 4 columns × 2 rows. Cards 2.18 wide × 1.15 tall.
  // 4 cols × 2.18 + 3 gaps × 0.1 = 9.02 (centered start 0.49). 2 rows × 1.15 + 1 gap × 0.15 = 2.45.
  // Start y=2.55, ends 5.0 ✓
  const iW = 2.18, iH = 1.15, gapX = 0.1, gapY = 0.15;
  const iStartX = 0.49, iStartY = 2.55;
  interventions.forEach((it, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = iStartX + col * (iW + gapX);
    const y = iStartY + row * (iH + gapY);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: iW, h: iH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    // Number badge top-left
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.15, y: y + 0.15, w: 0.38, h: 0.38,
      fill: { color: C.sea }, line: { color: C.sea, width: 0 },
    });
    slide.addText(it.num, {
      x: x + 0.15, y: y + 0.15, w: 0.38, h: 0.38,
      fontSize: 13, fontFace: F.headline, color: C.night, bold: true,
      align: 'center', valign: 'middle', margin: 0,
    });
    // Cost top-right
    slide.addText(it.cost, {
      x: x + 0.6, y: y + 0.18, w: iW - 0.75, h: 0.3,
      fontSize: 9, fontFace: F.mono, color: it.cost === 'FREE' ? C.sea : C.sun,
      align: 'right', bold: true, margin: 0,
    });
    // Name (full width below)
    slide.addText(it.name, {
      x: x + 0.15, y: y + 0.55, w: iW - 0.3, h: 0.42,
      fontSize: 10, fontFace: F.headline, color: C.txt, bold: true,
      valign: 'top', margin: 0,
    });
    // Param indicator bottom
    slide.addText(it.param, {
      x: x + 0.15, y: y + iH - 0.27, w: iW - 0.3, h: 0.2,
      fontSize: 8, fontFace: F.mono, color: C.txt2, margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 12, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 13 — RWA TOKENIZATION FOR THE CARIBBEAN
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '12 · THE MISSION');
  title(slide, "Tokenizing the Caribbean's\nreal-world assets.");
  subtitle(slide, "Securities · Real estate · Bonds · Climate insurance — on-chain, regulated, accessible to every islander and every diaspora member.");

  // 3 stages of RWA expansion
  const stages = [
    { phase: 'PHASE 1 · 2026-2028', name: 'TTSE Tokenization', body: 'Trinidad & Tobago Stock Exchange equities wrapped on-chain. 30 stocks, 5 indices. Wam fiat bridge.' },
    { phase: 'PHASE 2 · 2028-2032', name: 'Caribbean Securities', body: 'Jamaica + Barbados + ECCS unified. Cross-border tokenized bond market. CBDC settlement integration.' },
    { phase: 'PHASE 3 · 2032+',     name: 'Real Estate + Climate', body: 'Fractional Caribbean real estate. Climate catastrophe bonds. Insurance instruments for hurricane resilience.' },
  ];

  const sW = 2.95, sH = 1.95, sGap = 0.18;
  const sStartX = 0.5, sStartY = 3.0;
  stages.forEach((stage, i) => {
    const x = sStartX + i * (sW + sGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: sStartY, w: sW, h: sH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: sStartY, w: sW, h: 0.08,
      fill: { color: C.sea }, line: { color: C.sea, width: 0 },
    });
    slide.addText(stage.phase, {
      x: x + 0.2, y: sStartY + 0.25, w: sW - 0.4, h: 0.3,
      fontSize: 9, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 1, margin: 0,
    });
    slide.addText(stage.name, {
      x: x + 0.2, y: sStartY + 0.6, w: sW - 0.4, h: 0.5,
      fontSize: 16, fontFace: F.headline, color: C.txt, bold: true, margin: 0,
    });
    slide.addText(stage.body, {
      x: x + 0.2, y: sStartY + 1.15, w: sW - 0.4, h: 0.75,
      fontSize: 10, fontFace: F.body, color: C.txt2, valign: 'top', margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 13, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 14 — UNIVERSAL BASIC OWNERSHIP
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '13 · UBO');
  title(slide, 'Universal Basic Ownership.');
  subtitle(slide, "Not equity for founders. Equity for users. The Caribbean diaspora as shareholders in their region's financial future.");

  // Two big stat callouts (compress to leave room for quote at bottom)
  const cardW = 4.4, cardH = 1.9, cardY = 2.7;
  // 50/50 split
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: cardY, w: cardW, h: cardH,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });
  slide.addText('50 / 50', {
    x: 0.5, y: cardY + 0.2, w: cardW, h: 1.0,
    fontSize: 60, fontFace: F.headline, color: C.sea, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText('TOKEN SUPPLY SPLIT', {
    x: 0.5, y: cardY + 1.25, w: cardW, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.txt2, bold: true, charSpacing: 3, align: 'center', margin: 0,
  });
  slide.addText('500M to community via airdrops, learn-to-earn,\nliquidity mining and referrals. 500M to operations,\ntreasury, team — all vested and transparent.', {
    x: 0.7, y: cardY + 1.55, w: cardW - 0.4, h: 0.6,
    fontSize: 11, fontFace: F.body, color: C.txt, align: 'center', margin: 0,
  });

  // Revenue share
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: cardY, w: cardW, h: cardH,
    fill: { color: C.night2 }, line: { color: C.coral, width: 1 },
  });
  slide.addText('50%', {
    x: 5.1, y: cardY + 0.2, w: cardW, h: 1.0,
    fontSize: 60, fontFace: F.headline, color: C.coral, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText('REVENUE TO STAKERS', {
    x: 5.1, y: cardY + 1.25, w: cardW, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.txt2, bold: true, charSpacing: 3, align: 'center', margin: 0,
  });
  slide.addText('Real yield in USDC + SOL — never in inflated $LIMER.\nIrrevocably encoded in the Protocol Charter.\nNo entity holds >25% voting power.', {
    x: 5.3, y: cardY + 1.55, w: cardW - 0.4, h: 0.6,
    fontSize: 11, fontFace: F.body, color: C.txt, align: 'center', margin: 0,
  });

  // Bottom quote (within MAX_CONTENT_Y)
  slide.addText('"The Caribbean diaspora has $20B in remittances flowing home each year. UBO turns those flows into ownership stakes — not just cash transfers."', {
    x: 0.5, y: 4.8, w: 9, h: 0.3,
    fontSize: 10, fontFace: F.body, color: C.txt2, italic: true, align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 14, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 15 — TOKENOMICS & REVENUE STREAMS
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '14 · TOKENOMICS');
  title(slide, '$LIMER · 1B supply · 7 streams.');

  // Revenue streams as pie-style chart (using horizontal bars instead for clarity)
  const streams = [
    { name: 'Spot Trading Fees',     pct: 30, color: C.sea },
    { name: 'Perpetuals Fees',       pct: 25, color: C.coral },
    { name: 'TTSE Listing Fees',     pct: 15, color: C.sun },
    { name: 'Premium (Wam + ViFi)',  pct: 10, color: C.palm },
    { name: 'Institutional API',     pct: 10, color: C.seaDk },
    { name: 'Referrals',             pct:  5, color: C.coral },
    { name: 'Bridge Conversions',    pct:  5, color: C.sun },
  ];

  // Replace fragile doughnut chart with hand-drawn horizontal bars + labels
  // Bar chart spans full width. Each row: label · bar · percentage
  const barStartX = 0.5;
  const barStartY = 2.55;
  const rowH = 0.34;
  const labelW = 2.3;
  const barMaxW = 5.0;  // bar fills representing percentage
  const pctW = 0.7;

  streams.forEach((s, i) => {
    const y = barStartY + i * rowH;
    // Label
    slide.addText(s.name, {
      x: barStartX, y, w: labelW, h: rowH,
      fontSize: 12, fontFace: F.body, color: C.txt, valign: 'middle', margin: 0,
    });
    // Track (background bar)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: barStartX + labelW, y: y + 0.09, w: barMaxW, h: 0.16,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    // Filled bar (proportional to pct, max=30 → barMaxW)
    const fillW = (s.pct / 30) * barMaxW;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: barStartX + labelW, y: y + 0.09, w: fillW, h: 0.16,
      fill: { color: s.color }, line: { color: s.color, width: 0 },
    });
    // Percentage right-aligned
    slide.addText(`${s.pct}%`, {
      x: barStartX + labelW + barMaxW + 0.15, y, w: pctW, h: rowH,
      fontSize: 12, fontFace: F.mono, color: C.txt, bold: true,
      align: 'right', valign: 'middle', margin: 0,
    });
  });

  // Bottom note
  slide.addText('1B token supply · 50% community / 50% protocol · revenue distributed in USDC + SOL', {
    x: 0.5, y: 4.85, w: 9, h: 0.25,
    fontSize: 10, fontFace: F.body, color: C.sea, italic: true,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 15, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 16 — ROADMAP
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '15 · ROADMAP');
  title(slide, 'From hackathon to centennial institution.');

  // 3 phases
  const phases = [
    {
      tag: 'NOW · 2026-2027', title: 'Nucleation Sprint', color: C.sea,
      milestones: [
        '✓ Live at limerscapital.com',
        '✓ 19 pages · 361 tests · 22 jurisdictions',
        '✓ Bulk-style landing + Disclaimer + Squeeze CTA',
        '→ 100K MAU + token launch',
      ],
    },
    {
      tag: '2028-2033', title: 'Crystallization', color: C.coral,
      milestones: [
        '→ Multi-sig + Advisory Council in place',
        '→ University partnerships (UWI, UTT, UTech)',
        '→ Bermuda DABA registration',
        '→ Wam VASP integration → real TTD on-ramp',
      ],
    },
    {
      tag: '2034-2045', title: 'Caribbean Super-App', color: C.sun,
      milestones: [
        '→ Remittance corridor live (1.5% vs 7.1%)',
        '→ TTSE RWA tokenization legal wrapper',
        '→ CBDC interoperability across 5 jurisdictions',
        '→ 1.8M MAU · $180M ARR',
      ],
    },
  ];

  const phW = 2.95, phH = 2.5, phGap = 0.18;
  const phStartX = 0.5, phStartY = 2.5;
  phases.forEach((p, i) => {
    const x = phStartX + i * (phW + phGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: phStartY, w: phW, h: phH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: phStartY, w: phW, h: 0.08,
      fill: { color: p.color }, line: { color: p.color, width: 0 },
    });
    slide.addText(p.tag, {
      x: x + 0.2, y: phStartY + 0.22, w: phW - 0.4, h: 0.25,
      fontSize: 9, fontFace: F.mono, color: p.color, bold: true, charSpacing: 1, margin: 0,
    });
    slide.addText(p.title, {
      x: x + 0.2, y: phStartY + 0.5, w: phW - 0.4, h: 0.5,
      fontSize: 17, fontFace: F.headline, color: C.txt, bold: true, margin: 0,
    });
    // Milestones
    slide.addText(
      p.milestones.map((m, idx) => ({
        text: m,
        options: { color: m.startsWith('✓') ? C.sea : C.txt, breakLine: idx < p.milestones.length - 1 },
      })),
      {
        x: x + 0.2, y: phStartY + 1.05, w: phW - 0.4, h: 1.4,
        fontSize: 10, fontFace: F.body, valign: 'top', paraSpaceAfter: 4, margin: 0,
      },
    );
  });

  brandFooter(slide);
  pageNumber(slide, 16, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 17 — TEAM + ASK
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '16 · THE ASK');
  title(slide, 'What we need.\nWhat we offer.');

  const colW = 4.4, colY = 2.55, colH = 2.45;

  // LEFT — what we need
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
  });
  slide.addText('THE ASK', {
    x: 0.7, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.sun, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: 'Capital: ', options: { bold: true, color: C.sea } },
    { text: 'Pre-seed runway through Era I nucleation — focused on critical-mass + multi-jurisdictional licensing', options: { color: C.txt, breakLine: true } },
    { text: 'Advisors: ', options: { bold: true, color: C.sea } },
    { text: 'Caribbean fintech, Solana ecosystem, regional academic, diaspora community leader', options: { color: C.txt, breakLine: true } },
    { text: 'Partners: ', options: { bold: true, color: C.sea } },
    { text: 'TTSEC LOI, UWI/UTT curriculum partnership, Wam VASP integration, second jurisdiction (Bermuda DABA)', options: { color: C.txt } },
  ], {
    x: 0.7, y: colY + 0.55, w: colW - 0.4, h: 1.8,
    fontSize: 11, fontFace: F.body, valign: 'top', paraSpaceAfter: 8, margin: 0,
  });

  // RIGHT — what we offer
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });
  slide.addText('THE OFFER', {
    x: 5.3, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: 'Production-ready platform: ', options: { color: C.txt, bold: true } },
    { text: '19 pages, 361 tests, real Jupiter swaps.', options: { color: C.txt2, breakLine: true } },
    { text: 'Whitespace position: ', options: { color: C.txt, bold: true } },
    { text: '0 of 5,400+ Colosseum projects target this region.', options: { color: C.txt2, breakLine: true } },
    { text: '100-year vision: ', options: { color: C.txt, bold: true } },
    { text: 'mathematical survival model + 8 antifragility interventions.', options: { color: C.txt2, breakLine: true } },
    { text: 'Universal Basic Ownership: ', options: { color: C.txt, bold: true } },
    { text: 'users own the platform, encoded in an irrevocable charter.', options: { color: C.txt2 } },
  ], {
    x: 5.3, y: colY + 0.55, w: colW - 0.4, h: 1.85,
    fontSize: 10.5, fontFace: F.body, valign: 'top', paraSpaceAfter: 5, margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 17, TOTAL);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 18 — CLOSING CTA
// ═══════════════════════════════════════════════════════════════════
{
  const slide = pres.addSlide();
  darkBg(slide);

  // Big sparkle
  slide.addText('✦', {
    x: 0, y: 0.7, w: W, h: 0.6,
    fontSize: 48, fontFace: F.headline, color: C.sea,
    align: 'center', valign: 'middle', margin: 0, bold: true,
  });

  // Main statement (2 lines, mixed colors)
  slide.addText([
    { text: '22 Nations.', options: { color: C.sea, bold: true } },
  ], {
    x: 0, y: 1.4, w: W, h: 0.85,
    fontSize: 60, fontFace: F.headline, align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText([
    { text: 'One Platform.', options: { color: C.coral, bold: true } },
  ], {
    x: 0, y: 2.2, w: W, h: 0.85,
    fontSize: 60, fontFace: F.headline, align: 'center', valign: 'middle', margin: 0,
  });
  slide.addText([
    { text: '100 Years.', options: { color: C.sun, bold: true } },
  ], {
    x: 0, y: 3.0, w: W, h: 0.85,
    fontSize: 60, fontFace: F.headline, align: 'center', valign: 'middle', margin: 0,
  });

  // URL
  slide.addText('limerscapital.com', {
    x: 0, y: 4.15, w: W, h: 0.5,
    fontSize: 24, fontFace: F.mono, color: C.sea, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Built on Solana
  slide.addText('Built on Solana ◎', {
    x: 0, y: 4.65, w: W, h: 0.3,
    fontSize: 11, fontFace: F.mono, color: C.txt2,
    align: 'center', charSpacing: 3, margin: 0,
  });

  // Socials
  slide.addText('@limerscapital · X · Instagram · TikTok', {
    x: 0, y: 5.0, w: W, h: 0.3,
    fontSize: 9, fontFace: F.mono, color: C.muted,
    align: 'center', charSpacing: 2, margin: 0,
  });
}

// ── Save ──────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', 'Limers-Capital-Pitch-Deck-v2.pptx');
pres.writeFile({ fileName: outPath })
  .then((file) => {
    console.log(`✓ Pitch deck v2 written to: ${file}`);
    console.log(`  ${TOTAL} slides · 16:9 widescreen · brand colors applied`);
  })
  .catch((err) => {
    console.error('✗ Failed to write pitch deck:', err);
    process.exit(1);
  });
