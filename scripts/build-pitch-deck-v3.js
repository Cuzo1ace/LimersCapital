/**
 * Limer's Capital — Pitch Deck v3 Builder
 * ----------------------------------------
 * Generates a comprehensive 18-slide investor pitch deck focused on
 * Caribbean capital markets tokenization — the "Ondo for the Caribbean" thesis.
 *
 * Run: node scripts/build-pitch-deck-v3.js
 * Output: Limers-Capital-Pitch-Deck-v3.pptx (project root)
 */

const path = require('path');
const fs = require('fs');

// Resolve pptxgenjs from global install
const globalNodeModules = '/Users/ace369/.npm-global/lib/node_modules';
const pptxgen = require(path.join(globalNodeModules, 'pptxgenjs'));

// ── Brand Tokens ──────────────────────────────────────────────────
const C = {
  night:    '0D0E10',
  night2:   '1A1B1F',
  night3:   '252730',
  sea:      '00FFA3',
  seaDk:    '00EF99',
  coral:    'BF81FF',
  sun:      'FFCA3A',
  palm:     '2D9B56',
  down:     'FF716C',
  ttseRed:  'FF4D6D',
  txt:      'FDFBFE',
  txt2:     'ABABAD',
  muted:    '6B6C6E',
  border:   '3A3C40',
};

const F = {
  headline: 'Helvetica Neue',
  body:     'Helvetica',
  mono:     'Courier New',
};

// ── Setup ─────────────────────────────────────────────────────────
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10" x 5.625"
pres.author = "Limer's Capital";
pres.title  = "Limer's Capital — Pitch Deck v3 (April 2026)";
pres.company = "Limer's Capital";
pres.subject = "Caribbean Capital Markets on Solana — Local Stocks, Regional Markets, Global Access";

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
  slide.addText('\u2726', {
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

// =====================================================================
// SLIDE 1 — COVER
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);

  // Big sparkle ornament
  slide.addText('\u2726', {
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
    { text: "Local stocks.",      options: { color: C.sea } },
    { text: " Regional markets.", options: { color: C.coral } },
    { text: " Global access.",    options: { color: C.sun } },
  ], {
    x: 0, y: 2.95, w: W, h: 0.6,
    fontSize: 24, fontFace: F.headline, italic: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Subtitle
  slide.addText("The on-chain gateway to Caribbean capital markets \u2014 built on Solana", {
    x: 0.5, y: 3.7, w: 9, h: 0.4,
    fontSize: 14, fontFace: F.body, color: C.txt2, align: 'center', margin: 0,
  });

  // Bottom accent line
  slide.addShape(pres.shapes.LINE, {
    x: 4.0, y: 4.45, w: 2.0, h: 0,
    line: { color: C.sea, width: 1.5 },
  });

  // Footer line
  slide.addText("Pitch Deck v3 \u00b7 April 2026 \u00b7 limerscapital.com", {
    x: 0, y: 5.05, w: W, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.muted, align: 'center', margin: 0, charSpacing: 2,
  });
}

// =====================================================================
// SLIDE 2 — THE OPPORTUNITY
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '01 \u00b7 THE OPPORTUNITY');
  title(slide, '$37B in Caribbean equities.\nStructurally undervalued.');

  // 4 stat cards in a 2x2 grid
  const cardW = 4.4, cardH = 1.2, gap = 0.15;
  const startX = 0.5, startY = 2.5;

  statCard(slide, startX, startY, cardW, cardH, {
    label: 'TTSE PE RATIO', value: '9.9\u00d7', color: C.ttseRed,
    caption: 'vs 12.0x 3-year average',
  });
  statCard(slide, startX + cardW + gap, startY, cardW, cardH, {
    label: 'VS JAMAICA (JSE)', value: '26%', color: C.sea,
    caption: 'discount',
  });
  statCard(slide, startX, startY + cardH + gap, cardW, cardH, {
    label: 'VS EMERGING MARKETS', value: '42%', color: C.sun,
    caption: 'below average',
  });
  statCard(slide, startX + cardW + gap, startY + cardH + gap, cardW, cardH, {
    label: 'VS DEVELOPED MARKETS', value: '53%', color: C.coral,
    caption: 'below S&P 500',
  });

  brandFooter(slide);
  pageNumber(slide, 2, TOTAL);
}

// =====================================================================
// SLIDE 3 — WHY UNDERVALUED?
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '02 \u00b7 STRUCTURAL DISCOUNT');
  title(slide, 'Not a quality problem.\nA plumbing problem.');

  const rows = [
    { icon: '\uD83D\uDCA7', name: 'Illiquidity',    pct: '20-30%', desc: 'Many stocks trade only a few times per month',              solve: '24/7 global trading on Solana' },
    { icon: '\uD83E\uDDE9', name: 'Fragmentation',  pct: '5-10%',  desc: '5 separate exchanges, 5% price differentials',              solve: 'Single unified order book on-chain' },
    { icon: '\uD83C\uDFE2', name: 'Conglomerate',   pct: '10-15%', desc: "Can't invest in individual divisions",                      solve: 'Tokenize subsidiaries individually' },
    { icon: '\uD83D\uDD0D', name: 'Information',    pct: '5-10%',  desc: 'Zero analyst coverage, no Bloomberg',                       solve: 'On-chain analytics + AI research' },
    { icon: '\uD83D\uDD12', name: 'Access',         pct: '5-10%',  desc: 'No ETFs, no ADRs, capital controls',                        solve: 'Any Solana wallet worldwide' },
  ];

  const rowH = 0.42, rowGap = 0.06;
  const startY = 2.55;

  rows.forEach((r, i) => {
    const y = startY + i * (rowH + rowGap);
    // Row background
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: rowH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    // Left accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.06, h: rowH,
      fill: { color: C.sea }, line: { color: C.sea, width: 0 },
    });
    // Icon
    slide.addText(r.icon, {
      x: 0.65, y, w: 0.35, h: rowH,
      fontSize: 14, fontFace: F.body, align: 'center', valign: 'middle', margin: 0,
    });
    // Name
    slide.addText(r.name, {
      x: 1.05, y, w: 1.2, h: rowH,
      fontSize: 11, fontFace: F.headline, color: C.txt, bold: true, valign: 'middle', margin: 0,
    });
    // Impact %
    slide.addText(r.pct, {
      x: 2.3, y, w: 0.7, h: rowH,
      fontSize: 11, fontFace: F.mono, color: C.sea, bold: true, valign: 'middle', margin: 0,
    });
    // Description
    slide.addText(r.desc, {
      x: 3.05, y, w: 2.85, h: rowH,
      fontSize: 9.5, fontFace: F.body, color: C.txt2, valign: 'middle', margin: 0,
    });
    // Arrow
    slide.addText('\u2192', {
      x: 5.95, y, w: 0.3, h: rowH,
      fontSize: 12, fontFace: F.headline, color: C.sea, valign: 'middle', align: 'center', margin: 0,
    });
    // How tokenization solves it
    slide.addText(r.solve, {
      x: 6.3, y, w: 3.1, h: rowH,
      fontSize: 9.5, fontFace: F.body, color: C.muted, valign: 'middle', margin: 0,
    });
  });

  // Bottom: combined discount
  slide.addText('Combined structural discount: 45\u201365%', {
    x: 0.5, y: 4.95, w: 9, h: 0.25,
    fontSize: 11, fontFace: F.mono, color: C.sea, bold: true,
    align: 'center', margin: 0, charSpacing: 2,
  });

  brandFooter(slide);
  pageNumber(slide, 3, TOTAL);
}

// =====================================================================
// SLIDE 4 — THE VISION (3-Layer Architecture)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '03 \u00b7 THE ARCHITECTURE');
  title(slide, 'Local stocks. Regional markets.\nGlobal access.');

  const cardW = 2.95, cardH = 2.75, gap = 0.18;
  const startX = 0.5, startY = 2.2;

  const layers = [
    {
      name: 'LOCAL', accent: C.ttseRed, sub: 'Your home exchange, on-chain',
      count: '30+ stocks', badge: 'Live (paper trading)', badgeColor: C.sea,
      bullets: ['TTSE 30 stocks', 'TTD balances', 'Wam fiat on-ramp', 'TTSEC regulatory mapping'],
    },
    {
      name: 'REGIONAL', accent: C.sea, sub: "The Caribbean's unified capital market",
      count: '100+ stocks', badge: 'Expanding (12-18mo)', badgeColor: C.sun,
      bullets: ['JSE 45+ companies', 'BSE 20 companies', 'ECSE 8 nations', 'Cross-border settlement'],
    },
    {
      name: 'GLOBAL', accent: C.coral, sub: 'Access every market through one wallet',
      count: '200+ US + all Solana', badge: 'Via Solana ecosystem', badgeColor: C.coral,
      bullets: ['Ondo Finance 200+ US stocks', 'Jupiter swaps', 'Diaspora corridor', 'CBDC interop'],
    },
  ];

  layers.forEach((layer, i) => {
    const x = startX + i * (cardW + gap);
    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
    });
    // Color accent bar (top)
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: startY, w: cardW, h: 0.08,
      fill: { color: layer.accent }, line: { color: layer.accent, width: 0 },
    });
    // Layer name
    slide.addText(layer.name, {
      x: x + 0.2, y: startY + 0.2, w: cardW - 0.4, h: 0.35,
      fontSize: 18, fontFace: F.headline, color: layer.accent, bold: true, margin: 0,
    });
    // Subtitle
    slide.addText(layer.sub, {
      x: x + 0.2, y: startY + 0.55, w: cardW - 0.4, h: 0.3,
      fontSize: 10, fontFace: F.body, color: C.txt2, margin: 0,
    });
    // Count
    slide.addText(layer.count, {
      x: x + 0.2, y: startY + 0.9, w: cardW - 0.4, h: 0.3,
      fontSize: 14, fontFace: F.headline, color: C.txt, bold: true, margin: 0,
    });
    // Badge
    slide.addText(layer.badge, {
      x: x + 0.2, y: startY + 1.2, w: cardW - 0.4, h: 0.25,
      fontSize: 9, fontFace: F.mono, color: layer.badgeColor, bold: true, charSpacing: 1, margin: 0,
    });
    // Bullet items
    slide.addText(
      layer.bullets.map((b, idx) => ({
        text: b,
        options: { bullet: true, color: C.txt, breakLine: idx < layer.bullets.length - 1 },
      })),
      {
        x: x + 0.2, y: startY + 1.55, w: cardW - 0.4, h: 1.1,
        fontSize: 10, fontFace: F.body, valign: 'top', paraSpaceAfter: 3, margin: 0,
      },
    );
  });

  brandFooter(slide);
  pageNumber(slide, 4, TOTAL);
}

// =====================================================================
// SLIDE 5 — LAYER DEEP-DIVE ("Ondo for the Caribbean")
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '04 \u00b7 THE POSITIONING');
  title(slide, 'Ondo for the Caribbean.');

  const colW = 4.0, colH = 2.6, colY = 2.4;

  // LEFT — Ondo Finance
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.75 },
  });
  slide.addText('ONDO FINANCE', {
    x: 0.7, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.txt2, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: 'Brings US stocks to global users via Solana', options: { color: C.txt, breakLine: true } },
    { text: '200+ stocks', options: { color: C.txt, bold: true, breakLine: true } },
    { text: '$255M BlackRock fund', options: { color: C.txt, bold: true, breakLine: true } },
    { text: 'Institutional-grade backing', options: { color: C.txt2 } },
  ], {
    x: 0.7, y: colY + 0.6, w: colW - 0.4, h: 1.8,
    fontSize: 13, fontFace: F.body, valign: 'top', paraSpaceAfter: 6, margin: 0,
  });

  // Arrow
  slide.addText('\u2192', {
    x: colW + 0.5, y: colY + 0.5, w: 0.6, h: 1.0,
    fontSize: 40, fontFace: F.headline, color: C.sea,
    align: 'center', valign: 'middle', bold: true, margin: 0,
  });

  // RIGHT — Limer's Capital (highlighted)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: colY, w: colW, h: colH,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1.0 },
  });
  slide.addText("LIMER'S CAPITAL", {
    x: 5.3, y: colY + 0.2, w: colW - 0.4, h: 0.3,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true, charSpacing: 3, margin: 0,
  });
  slide.addText([
    { text: 'Brings Caribbean stocks to global users via Solana', options: { color: C.txt, breakLine: true } },
    { text: '30+ stocks (expanding to 100+)', options: { color: C.txt, bold: true, breakLine: true } },
    { text: 'VASP-licensed fiat bridge', options: { color: C.txt, bold: true, breakLine: true } },
    { text: 'Caribbean market is MORE undervalued (9.9x vs US 20x+)', options: { color: C.sea } },
  ], {
    x: 5.3, y: colY + 0.6, w: colW - 0.4, h: 1.8,
    fontSize: 13, fontFace: F.body, valign: 'top', paraSpaceAfter: 6, margin: 0,
  });

  // Bottom
  slide.addText('Same thesis. Different market. More upside.', {
    x: 0.5, y: 4.95, w: 9, h: 0.25,
    fontSize: 12, fontFace: F.body, color: C.sea, italic: true, bold: true,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 5, TOTAL);
}

// =====================================================================
// SLIDE 6 — GLOBAL VS LOCAL
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '05 \u00b7 THE COMPARISON');
  title(slide, 'Apple at 28\u00d7.\nANSA McAL at 10\u00d7.');

  const comparisons = [
    {
      global: 'Apple', gPE: '28x PE', gDiv: '0.5% div',
      local: 'ANSA McAL', lPE: '10x PE', lDiv: '3.2% div',
      verdict: '64% lower PE, 6\u00d7 higher yield',
    },
    {
      global: 'JPMorgan', gPE: '12x PE', gDiv: '2.3% div',
      local: 'Republic Bank', lPE: '8.5x PE', lDiv: '4.5% div',
      verdict: "29% discount to world's largest bank",
    },
    {
      global: 'S&P 500', gPE: '21x PE', gDiv: '1.3% div',
      local: 'TTSE Composite', lPE: '9.9x PE', lDiv: '3.5% div',
      verdict: 'An entire market at half the US valuation',
    },
  ];

  const cardH = 0.75, cardGap = 0.12;
  const startY = 2.55;

  comparisons.forEach((comp, i) => {
    const y = startY + i * (cardH + cardGap);
    // Full-width card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: cardH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    // Left column: Global
    slide.addText(comp.global, {
      x: 0.7, y, w: 1.6, h: cardH,
      fontSize: 13, fontFace: F.headline, color: C.txt, bold: true, valign: 'middle', margin: 0,
    });
    slide.addText(comp.gPE + '  |  ' + comp.gDiv, {
      x: 2.3, y, w: 1.8, h: cardH,
      fontSize: 10, fontFace: F.mono, color: C.txt2, valign: 'middle', margin: 0,
    });
    // VS divider
    slide.addText('vs', {
      x: 4.1, y, w: 0.5, h: cardH,
      fontSize: 11, fontFace: F.mono, color: C.muted, valign: 'middle', align: 'center', margin: 0,
    });
    // Right column: Local
    slide.addText(comp.local, {
      x: 4.6, y, w: 1.7, h: cardH,
      fontSize: 13, fontFace: F.headline, color: C.sea, bold: true, valign: 'middle', margin: 0,
    });
    slide.addText(comp.lPE + '  |  ' + comp.lDiv, {
      x: 6.3, y, w: 1.8, h: cardH,
      fontSize: 10, fontFace: F.mono, color: C.sea, valign: 'middle', margin: 0,
    });
    // Verdict
    slide.addText(comp.verdict, {
      x: 0.7, y: y + cardH - 0.22, w: 8.6, h: 0.2,
      fontSize: 9, fontFace: F.body, color: C.sun, italic: true, margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 6, TOTAL);
}

// =====================================================================
// SLIDE 7 — THE VALUE UNLOCK
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '06 \u00b7 THE MATH');
  title(slide, '$8.9B in value creation.');

  // Big stat callout
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.5, w: 9, h: 1.1,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });

  // Combined Caribbean equities
  slide.addText('$37B', {
    x: 0.7, y: 2.55, w: 2.2, h: 0.9,
    fontSize: 42, fontFace: F.headline, color: C.sea, bold: true, valign: 'middle', margin: 0,
  });
  slide.addText('Combined Caribbean equities', {
    x: 2.9, y: 2.55, w: 2.5, h: 0.45,
    fontSize: 11, fontFace: F.body, color: C.txt2, valign: 'middle', margin: 0,
  });

  // Arrow
  slide.addText('\u2192', {
    x: 5.2, y: 2.55, w: 0.5, h: 0.9,
    fontSize: 30, fontFace: F.headline, color: C.sea, align: 'center', valign: 'middle', bold: true, margin: 0,
  });

  // PE re-rating
  slide.addText([
    { text: '9.9x \u2192 14x PE', options: { color: C.txt, bold: true } },
  ], {
    x: 5.7, y: 2.55, w: 2.0, h: 0.45,
    fontSize: 16, fontFace: F.headline, valign: 'middle', margin: 0,
  });
  slide.addText('+41% upside', {
    x: 7.7, y: 2.55, w: 1.6, h: 0.45,
    fontSize: 14, fontFace: F.mono, color: C.sun, bold: true, valign: 'middle', margin: 0,
  });

  // Remittance line
  slide.addText('Remittance corridor: $20.4B/yr at 7.1% cost', {
    x: 5.7, y: 3.05, w: 3.5, h: 0.4,
    fontSize: 10, fontFace: F.body, color: C.txt2, valign: 'middle', margin: 0,
  });

  // Remittance box
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.8, w: 9, h: 0.65,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
  });
  slide.addText([
    { text: 'Remittance corridor: ', options: { color: C.txt2 } },
    { text: '$20.4B/yr', options: { color: C.sun, bold: true } },
    { text: ' at 7.1% cost \u2192 1.5% = ', options: { color: C.txt2 } },
    { text: '$1.1B', options: { color: C.sea, bold: true } },
    { text: ' in annual consumer savings', options: { color: C.txt2 } },
  ], {
    x: 0.7, y: 3.85, w: 8.6, h: 0.5,
    fontSize: 13, fontFace: F.body, valign: 'middle', margin: 0,
  });

  // Bottom italic
  slide.addText('Even capturing 0.25% of value creation = $22M annual revenue opportunity', {
    x: 0.5, y: 4.65, w: 9, h: 0.3,
    fontSize: 11, fontFace: F.body, color: C.sea, italic: true,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 7, TOTAL);
}

// =====================================================================
// SLIDE 8 — HOW WE GET USERS THERE (same as v2 slide 4)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '07 \u00b7 THE PRODUCT');
  title(slide, 'Learn. Trade. Earn. Grow.');
  subtitle(slide, 'Education is the funnel. Capital markets is the product.');

  // 4 cards in a single row
  const cardW = 2.15, cardH = 2.15, gap = 0.15;
  const startX = 0.5, startY = 2.95;
  const cards = [
    { title: 'LEARN',  body: '8 modules \u00b7 37 lessons \u00b7 8 quizzes. From wallets to advanced LP strategies.', color: C.sea },
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
  pageNumber(slide, 8, TOTAL);
}

// =====================================================================
// SLIDE 9 — WHAT'S LIVE (same as v2 slide 5)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '08 \u00b7 TRACTION');
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
  slide.addText("Real Jupiter V6 swaps \u00b7 Solflare/Phantom wallet integration \u00b7 On-chain profiles \u00b7 PWA \u00b7 i18n in 3 languages \u00b7 Cloudflare Worker API proxy \u00b7 Vitest + Playwright tests", {
    x: 0.5, y: 4.95, w: 9, h: 0.4,
    fontSize: 10, fontFace: F.body, color: C.txt2, italic: true, align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 9, TOTAL);
}

// =====================================================================
// SLIDE 10 — BUILT WITH (tech stack) — NEW
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '09 \u00b7 TECHNOLOGY');
  title(slide, 'Built with world-class tools.');

  const categories = [
    { name: 'FRONTEND', color: C.sea, tools: 'React 18 \u00b7 Vite 8 \u00b7 Tailwind CSS 4 \u00b7 Framer Motion 12 \u00b7 Zustand 5 \u00b7 TanStack Query 5 \u00b7 i18next \u00b7 PWA (Workbox)' },
    { name: 'SOLANA',   color: C.coral, tools: 'Anchor (Rust) \u00b7 @solana/web3.js \u00b7 wallet-standard \u00b7 Jupiter V6 \u00b7 Pyth Hermes \u00b7 Helius RPC + DAS \u00b7 Meteora \u00b7 Percolator SDK' },
    { name: 'BACKEND',  color: C.sun, tools: 'Cloudflare Workers \u00b7 Cloudflare Pages \u00b7 Supabase (PostgreSQL) \u00b7 GitHub Actions CI/CD' },
    { name: 'AI & DESIGN', color: C.palm, tools: 'Claude (Anthropic) \u00b7 ElevenLabs TTS \u00b7 Remotion 4 \u00b7 Penpot \u00b7 PptxGenJS' },
    { name: 'TESTING',  color: C.seaDk, tools: 'Vitest (361 tests, 14 files) \u00b7 Playwright + WebKit \u00b7 python-pptx QA' },
  ];

  const rowH = 0.48, rowGap = 0.08;
  const startY = 2.5;

  categories.forEach((cat, i) => {
    const y = startY + i * (rowH + rowGap);
    // Row background
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: rowH,
      fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
    });
    // Left accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.06, h: rowH,
      fill: { color: cat.color }, line: { color: cat.color, width: 0 },
    });
    // Category name
    slide.addText(cat.name, {
      x: 0.7, y, w: 1.5, h: rowH,
      fontSize: 10, fontFace: F.mono, color: cat.color, bold: true, charSpacing: 2, valign: 'middle', margin: 0,
    });
    // Tools list
    slide.addText(cat.tools, {
      x: 2.3, y, w: 7.0, h: rowH,
      fontSize: 10, fontFace: F.body, color: C.txt, valign: 'middle', margin: 0,
    });
  });

  brandFooter(slide);
  pageNumber(slide, 10, TOTAL);
}

// =====================================================================
// SLIDE 11 — THE WHITESPACE (same as v2 slide 6)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '10 \u00b7 COMPETITIVE POSITION');
  title(slide, 'A whitespace no one else sees.');

  // Big A- grade callout
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.6, w: 3.0, h: 2.4,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });
  slide.addText('A\u2212', {
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

  // Right side: 4 differentiators
  const diffs = [
    { label: 'CARIBBEAN-SPECIFIC',    text: '0 of 5,400+ Colosseum projects target the region. Complete whitespace.' },
    { label: 'CROSS-CLUSTER',         text: 'Only project bridging "Gamified Education" + "Gamified Trading".' },
    { label: 'REGULATORY MAP',        text: '22-jurisdiction VASP / CBDC / DARE Act tracker. Nothing comparable.' },
    { label: 'EDUCATION + EXECUTION', text: 'Learn \u2192 Practice \u2192 Execute pipeline. Competitors do one, never all.' },
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
  pageNumber(slide, 11, TOTAL);
}

// =====================================================================
// SLIDE 12 — THE CENTENNIAL MODEL (same as v2 slide 7)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '11 \u00b7 THE 100-YEAR FRAMEWORK');
  title(slide, 'The Centennial Evolution Model');
  subtitle(slide, "Limer's as a dissipative structure (Prigogine, 1977) \u2014 analyzed across 5 disciplines: physics, economics, sociology, data science, software engineering.");

  // Era timeline as 6 boxes in a row
  const eras = [
    { num: 'I',   name: 'NUCLEATION',     years: '2026\u201433', color: C.sea },
    { num: 'II',  name: 'CRYSTALLIZE',    years: '2033\u201445', color: C.seaDk },
    { num: 'III', name: 'DIASPORA',       years: '2045\u201465', color: C.sun },
    { num: 'IV',  name: 'SOVEREIGN',      years: '2065\u201485', color: C.palm },
    { num: 'V',   name: 'GENERATIONAL',   years: '2085\u20142110', color: C.coral },
    { num: 'VI',  name: 'POST-PLATFORM',  years: '2110\u201426', color: C.muted },
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
  pageNumber(slide, 12, TOTAL);
}

// =====================================================================
// SLIDE 13 — SURVIVAL MATH (same as v2 slide 11)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '12 \u00b7 THE MATH OF SURVIVAL');
  title(slide, 'P(100) = 10% \u2192 29%');

  // Equation callout (centered)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 2.45, w: 7, h: 1.0,
    fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
  });
  slide.addText('P(T) = e^(\u2212\u03bbT) \u00d7 (1 + \u03b1T)^\u03b2', {
    x: 1.5, y: 2.55, w: 7, h: 0.8,
    fontSize: 28, fontFace: F.mono, color: C.sea, bold: true,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Three parameters in columns
  const pY = 3.55, pH = 1.35;
  const params = [
    { sym: '\u03bb', name: 'BASE MORTALITY',     from: '0.030', to: '0.022', color: C.sea,
      detail: '\u221227% via multi-sig succession,\nuniversity partnerships,\nchain abstraction' },
    { sym: '\u03b1', name: 'ANTIFRAGILITY',      from: '0.008', to: '0.012', color: C.coral,
      detail: '+50% via volatility\nharvesting treasury +\nopen-source protocol' },
    { sym: '\u03b2', name: 'GOVERNANCE QUALITY', from: '1.20',  to: '1.50',  color: C.sun,
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
      { text: ' \u2192 ', options: { color: C.txt2 } },
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

  // Bottom result
  slide.addText("Result: ~3\u00d7 improvement in centennial survival probability.", {
    x: 0.5, y: 5.0, w: 9, h: 0.25,
    fontSize: 10, fontFace: F.body, color: C.sea, italic: true, bold: true,
    align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 13, TOTAL);
}

// =====================================================================
// SLIDE 14 — UBO + TOKENOMICS (same as v2 slide 14)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '13 \u00b7 UBO');
  title(slide, 'Universal Basic Ownership.');
  subtitle(slide, "Not equity for founders. Equity for users. The Caribbean diaspora as shareholders in their region's financial future.");

  // Two big stat callouts
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
  slide.addText('500M to community via airdrops, learn-to-earn,\nliquidity mining and referrals. 500M to operations,\ntreasury, team \u2014 all vested and transparent.', {
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
  slide.addText('Real yield in USDC + SOL \u2014 never in inflated $LIMER.\nIrrevocably encoded in the Protocol Charter.\nNo entity holds >25% voting power.', {
    x: 5.3, y: cardY + 1.55, w: cardW - 0.4, h: 0.6,
    fontSize: 11, fontFace: F.body, color: C.txt, align: 'center', margin: 0,
  });

  // Bottom quote
  slide.addText('"The Caribbean diaspora has $20B in remittances flowing home each year. UBO turns those flows into ownership stakes \u2014 not just cash transfers."', {
    x: 0.5, y: 4.8, w: 9, h: 0.3,
    fontSize: 10, fontFace: F.body, color: C.txt2, italic: true, align: 'center', margin: 0,
  });

  brandFooter(slide);
  pageNumber(slide, 14, TOTAL);
}

// =====================================================================
// SLIDE 15 — SOLANA RWA ECOSYSTEM — NEW
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '14 \u00b7 SOLANA RWA');
  title(slide, "The $873M wave.\nLimer's rides it.");

  // 4 stat cards in 2x2 grid
  const cardW = 4.4, cardH = 1.2, gap = 0.15;
  const startX = 0.5, startY = 2.5;

  statCard(slide, startX, startY, cardW, cardH, {
    label: 'TOKENIZED RWAS ON SOLANA', value: '$873M', color: C.sea,
    caption: 'Jan 2026 record',
  });
  statCard(slide, startX + cardW + gap, startY, cardW, cardH, {
    label: 'TOKENIZED US STOCKS', value: '200+', color: C.coral,
    caption: 'via Ondo Finance',
  });
  statCard(slide, startX, startY + cardH + gap, cardW, cardH, {
    label: 'BLACKROCK BUIDL FUND', value: '$255M', color: C.sun,
    caption: 'on Solana',
  });
  statCard(slide, startX + cardW + gap, startY + cardH + gap, cardW, cardH, {
    label: 'MCKINSEY 2030 PROJECTION', value: '$2T', color: C.palm,
    caption: 'global RWA tokenization',
  });

  // Bottom
  slide.addText('Galaxy Research: Solana Internet Capital Markets \u2192 $2B by end 2026', {
    x: 0.5, y: 4.95, w: 9, h: 0.25,
    fontSize: 10, fontFace: F.mono, color: C.sea, bold: true,
    align: 'center', margin: 0, charSpacing: 1,
  });

  brandFooter(slide);
  pageNumber(slide, 15, TOTAL);
}

// =====================================================================
// SLIDE 16 — ROADMAP (4 phases)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '15 \u00b7 ROADMAP');
  title(slide, 'From prototype to\nCaribbean infrastructure.');

  const phases = [
    {
      tag: 'NOW \u00b7 2026', title: 'Launch', color: C.sea,
      milestones: [
        '\u2713 Live at limerscapital.com',
        '\u2713 19 pages \u00b7 361 tests',
        '\u2713 Landing + Disclaimer + Squeeze',
        '\u2192 100K MAU + token launch',
      ],
    },
    {
      tag: '6 MONTHS', title: 'Foundation', color: C.coral,
      milestones: [
        '\u2192 Multi-sig + Advisory Council',
        '\u2192 University partnerships (UWI, UTT)',
        '\u2192 Public analytics dashboard',
        '\u2192 Soulbound credential NFTs',
      ],
    },
    {
      tag: '12 MONTHS', title: 'Regional', color: C.sun,
      milestones: [
        '\u2192 JSE integration (Jamaica)',
        '\u2192 Bermuda DABA registration',
        '\u2192 Wam VASP integration live',
        '\u2192 Premium tier ($9.99/mo)',
      ],
    },
    {
      tag: '24 MONTHS', title: 'Scale', color: C.palm,
      milestones: [
        '\u2192 Remittance corridor pilot',
        '\u2192 CBDC testnet integration',
        '\u2192 TTSE RWA tokenization legal wrapper',
        '\u2192 1.8M MAU \u00b7 $180M ARR target',
      ],
    },
  ];

  const phW = 2.15, phH = 2.55, phGap = 0.15;
  const phStartX = 0.5, phStartY = 2.4;
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
      x: x + 0.15, y: phStartY + 0.22, w: phW - 0.3, h: 0.25,
      fontSize: 9, fontFace: F.mono, color: p.color, bold: true, charSpacing: 1, margin: 0,
    });
    slide.addText(p.title, {
      x: x + 0.15, y: phStartY + 0.5, w: phW - 0.3, h: 0.4,
      fontSize: 17, fontFace: F.headline, color: C.txt, bold: true, margin: 0,
    });
    // Milestones
    slide.addText(
      p.milestones.map((m, idx) => ({
        text: m,
        options: { color: m.startsWith('\u2713') ? C.sea : C.txt, breakLine: idx < p.milestones.length - 1 },
      })),
      {
        x: x + 0.15, y: phStartY + 0.95, w: phW - 0.3, h: 1.55,
        fontSize: 9.5, fontFace: F.body, valign: 'top', paraSpaceAfter: 4, margin: 0,
      },
    );
  });

  brandFooter(slide);
  pageNumber(slide, 16, TOTAL);
}

// =====================================================================
// SLIDE 17 — THE ASK (same as v2 slide 17)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);
  eyebrow(slide, '16 \u00b7 THE ASK');
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
    { text: 'Pre-seed runway through Era I nucleation \u2014 focused on critical-mass + multi-jurisdictional licensing', options: { color: C.txt, breakLine: true } },
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

// =====================================================================
// SLIDE 18 — CLOSE (same as v2 slide 18)
// =====================================================================
{
  const slide = pres.addSlide();
  darkBg(slide);

  // Big sparkle
  slide.addText('\u2726', {
    x: 0, y: 0.7, w: W, h: 0.6,
    fontSize: 48, fontFace: F.headline, color: C.sea,
    align: 'center', valign: 'middle', margin: 0, bold: true,
  });

  // Main statement (3 lines, mixed colors)
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
  slide.addText('Built on Solana \u25ce', {
    x: 0, y: 4.65, w: W, h: 0.3,
    fontSize: 11, fontFace: F.mono, color: C.txt2,
    align: 'center', charSpacing: 3, margin: 0,
  });

  // Socials
  slide.addText('@limerscapital \u00b7 X \u00b7 Instagram \u00b7 TikTok', {
    x: 0, y: 5.0, w: W, h: 0.3,
    fontSize: 9, fontFace: F.mono, color: C.muted,
    align: 'center', charSpacing: 2, margin: 0,
  });
}

// ── Save ──────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', 'Limers-Capital-Pitch-Deck-v3.pptx');
pres.writeFile({ fileName: outPath })
  .then((file) => {
    console.log(`\u2713 Pitch deck v3 written to: ${file}`);
    console.log(`  ${TOTAL} slides \u00b7 16:9 widescreen \u00b7 brand colors applied`);
  })
  .catch((err) => {
    console.error('\u2717 Failed to write pitch deck:', err);
    process.exit(1);
  });
