/**
 * Limer's Capital — V4 One-Pager (Investor Conference Handout)
 * ─────────────────────────────────────────────────────────────
 * Single page. Portrait. Dark theme. Print-ready.
 * Hand it to someone at a conference and they get the full thesis.
 *
 * Run: node scripts/build-one-pager.js
 * Output: Limers-Capital-One-Pager.pptx
 */

const path = require('path');
const pptxgen = require(path.join('/Users/ace369/.npm-global/lib/node_modules', 'pptxgenjs'));

// ── Brand Colors (no # prefix!) ──
const C = {
  night: '0D0E10', night2: '1A1B1F', night3: '252730',
  sea: '00FFA3', seaDk: '00EF99', coral: 'BF81FF',
  sun: 'FFCA3A', palm: '2D9B56', down: 'FF716C',
  ttse: 'FF4D6D', txt: 'FDFBFE', txt2: 'ABABAD',
  muted: '6B6C6E', border: '3A3C40',
};
const F = { h: 'Helvetica Neue', b: 'Helvetica', m: 'Courier New' };

// ── Setup (Portrait Letter: 7.5" × 10") ──
const pres = new pptxgen();
pres.defineLayout({ name: 'LETTER_PORTRAIT', width: 7.5, height: 10 });
pres.layout = 'LETTER_PORTRAIT';
pres.author = "Limer's Capital";
pres.title = "Limer's Capital — One-Pager";

const W = 7.5, H = 10;
const M = 0.5; // margin
const CW = W - 2 * M; // content width = 6.5"

const slide = pres.addSlide();
slide.background = { color: C.night };

// Subtle ambient glow
slide.addShape(pres.shapes.OVAL, {
  x: -1.5, y: -1.5, w: 4, h: 4,
  fill: { color: C.sea, transparency: 95 },
  line: { color: C.sea, width: 0, transparency: 100 },
});
slide.addShape(pres.shapes.OVAL, {
  x: 5, y: 7, w: 4, h: 4,
  fill: { color: C.coral, transparency: 96 },
  line: { color: C.coral, width: 0, transparency: 100 },
});

let y = 0.35; // cursor

// ═══════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════
slide.addText([
  { text: '✦ ', options: { color: C.sea, fontSize: 14 } },
  { text: "LIMER'S CAPITAL", options: { color: C.txt, fontSize: 14, bold: true, charSpacing: 3 } },
], { x: M, y, w: 3.5, h: 0.35, fontFace: F.h, margin: 0 });

slide.addText('limerscapital.com', {
  x: M + 3.5, y, w: 3, h: 0.35,
  fontSize: 9, fontFace: F.m, color: C.sea, align: 'right', margin: 0,
});

y += 0.4;
slide.addShape(pres.shapes.LINE, {
  x: M, y, w: CW, h: 0,
  line: { color: C.sea, width: 1 },
});

// ═══════════════════════════════════════════════════════════
// THE OPPORTUNITY
// ═══════════════════════════════════════════════════════════
y += 0.25;
slide.addText('THE OPPORTUNITY', {
  x: M, y, w: CW, h: 0.25,
  fontSize: 9, fontFace: F.m, color: C.sea, bold: true, charSpacing: 4, margin: 0,
});

y += 0.3;
slide.addText([
  { text: '$37B ', options: { color: C.sea, bold: true } },
  { text: 'in Caribbean equities structurally undervalued by ', options: { color: C.txt } },
  { text: '45-65%', options: { color: C.sun, bold: true } },
  { text: '. Zero native DeFi platforms serve the region.', options: { color: C.txt } },
], { x: M, y, w: CW, h: 0.4, fontSize: 11, fontFace: F.b, margin: 0 });

// 4 stat cards
y += 0.5;
const stats = [
  { value: '9.9×', label: 'TTSE PE', sub: 'ratio', color: C.ttse },
  { value: '42%', label: 'below EM', sub: 'average', color: C.sun },
  { value: '$20B', label: 'annual', sub: 'remittances', color: C.sea },
  { value: '22', label: 'nations', sub: 'mapped', color: C.coral },
];
const sW = 1.5, sGap = 0.16;
stats.forEach((s, i) => {
  const x = M + i * (sW + sGap);
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: sW, h: 0.75,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
  });
  slide.addText(s.value, {
    x, y: y + 0.08, w: sW, h: 0.35,
    fontSize: 22, fontFace: F.h, color: s.color, bold: true, align: 'center', margin: 0,
  });
  slide.addText(`${s.label}\n${s.sub}`, {
    x, y: y + 0.42, w: sW, h: 0.3,
    fontSize: 7, fontFace: F.m, color: C.txt2, align: 'center', margin: 0,
  });
});

// ═══════════════════════════════════════════════════════════
// THE THESIS
// ═══════════════════════════════════════════════════════════
y += 0.95;
slide.addShape(pres.shapes.RECTANGLE, {
  x: M, y, w: CW, h: 0.7,
  fill: { color: C.night2 }, line: { color: C.sea, width: 0.75 },
});
slide.addText([
  { text: '"Ondo brings US stocks to global users via Solana.\n', options: { color: C.txt2, italic: true } },
  { text: "Limer's brings Caribbean stocks to global users via Solana.", options: { color: C.sea, italic: true, bold: true } },
  { text: '\nSame thesis. More upside."', options: { color: C.txt2, italic: true } },
], {
  x: M + 0.2, y: y + 0.05, w: CW - 0.4, h: 0.6,
  fontSize: 10, fontFace: F.b, align: 'center', valign: 'middle', margin: 0,
});

// ═══════════════════════════════════════════════════════════
// 3-LAYER ARCHITECTURE
// ═══════════════════════════════════════════════════════════
y += 0.9;
slide.addText('3-LAYER ARCHITECTURE', {
  x: M, y, w: CW, h: 0.22,
  fontSize: 9, fontFace: F.m, color: C.coral, bold: true, charSpacing: 4, margin: 0,
});

y += 0.28;
const layers = [
  { title: 'LOCAL', desc: 'TTSE 30+ stocks', status: 'Live now', color: C.ttse },
  { title: 'REGIONAL', desc: 'JSE+BSE+ECSE 100+', status: '12-18 months', color: C.sea },
  { title: 'GLOBAL', desc: 'Ondo 200+ US stocks', status: 'Via Solana', color: C.coral },
];
const lW = 2.06, lGap = 0.16;
layers.forEach((l, i) => {
  const x = M + i * (lW + lGap);
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: lW, h: 0.65,
    fill: { color: C.night2 }, line: { color: C.border, width: 0.5 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: lW, h: 0.05,
    fill: { color: l.color }, line: { color: l.color, width: 0 },
  });
  slide.addText(l.title, {
    x: x + 0.1, y: y + 0.1, w: lW - 0.2, h: 0.2,
    fontSize: 10, fontFace: F.h, color: l.color, bold: true, margin: 0,
  });
  slide.addText(l.desc, {
    x: x + 0.1, y: y + 0.28, w: lW - 0.2, h: 0.15,
    fontSize: 8, fontFace: F.b, color: C.txt, margin: 0,
  });
  slide.addText(l.status, {
    x: x + 0.1, y: y + 0.45, w: lW - 0.2, h: 0.15,
    fontSize: 7, fontFace: F.m, color: C.txt2, margin: 0,
  });
});

// ═══════════════════════════════════════════════════════════
// HOW WE GET USERS THERE
// ═══════════════════════════════════════════════════════════
y += 0.85;
slide.addText('HOW WE GET USERS THERE', {
  x: M, y, w: CW, h: 0.22,
  fontSize: 9, fontFace: F.m, color: C.sun, bold: true, charSpacing: 4, margin: 0,
});

y += 0.28;
slide.addText([
  { text: 'Learn', options: { color: C.sea, bold: true } },
  { text: ' → ', options: { color: C.muted } },
  { text: 'Trade', options: { color: C.coral, bold: true } },
  { text: ' → ', options: { color: C.muted } },
  { text: 'Earn', options: { color: C.sun, bold: true } },
  { text: ' → ', options: { color: C.muted } },
  { text: 'Grow', options: { color: C.palm, bold: true } },
], { x: M, y, w: CW, h: 0.25, fontSize: 13, fontFace: F.h, margin: 0 });

y += 0.28;
slide.addText('8 modules, 37 lessons  ·  $100K paper trading  ·  $LIMER points → tokens  ·  RWA tokenization + UBO', {
  x: M, y, w: CW, h: 0.2,
  fontSize: 8, fontFace: F.b, color: C.txt2, margin: 0,
});

// ═══════════════════════════════════════════════════════════
// WHAT'S BUILT
// ═══════════════════════════════════════════════════════════
y += 0.4;
slide.addText("WHAT'S BUILT", {
  x: M, y, w: CW, h: 0.22,
  fontSize: 9, fontFace: F.m, color: C.sea, bold: true, charSpacing: 4, margin: 0,
});

y += 0.26;
slide.addText('19 pages  ·  361 tests  ·  Real Jupiter V6 swaps  ·  PWA  ·  Wallet-standard  ·  On-chain profiles  ·  i18n (EN/ES/FR)', {
  x: M, y, w: CW, h: 0.2,
  fontSize: 8, fontFace: F.b, color: C.txt, margin: 0,
});

y += 0.22;
slide.addText('React 18 · Vite 8 · Tailwind 4 · Anchor (Rust) · Solana · Cloudflare Workers · Supabase · Claude AI · ElevenLabs · Remotion', {
  x: M, y, w: CW, h: 0.2,
  fontSize: 7, fontFace: F.m, color: C.txt2, margin: 0,
});

// ═══════════════════════════════════════════════════════════
// COMPETITIVE EDGE
// ═══════════════════════════════════════════════════════════
y += 0.38;
slide.addText('COMPETITIVE EDGE', {
  x: M, y, w: CW, h: 0.22,
  fontSize: 9, fontFace: F.m, color: C.coral, bold: true, charSpacing: 4, margin: 0,
});

y += 0.26;
slide.addText([
  { text: 'A⁻ grade', options: { color: C.sea, bold: true } },
  { text: '  ·  0 of 5,400+ Colosseum projects target the Caribbean  ·  Cross-cluster: education × trading', options: { color: C.txt } },
], { x: M, y, w: CW, h: 0.2, fontSize: 8, fontFace: F.b, margin: 0 });

y += 0.2;
slide.addText('Wam (VASP-licensed)  ·  22-jurisdiction regulatory map  ·  Solflare wallet partnership  ·  100-year centennial vision', {
  x: M, y, w: CW, h: 0.2,
  fontSize: 8, fontFace: F.b, color: C.txt2, margin: 0,
});

// ═══════════════════════════════════════════════════════════
// THE ASK + FDV
// ═══════════════════════════════════════════════════════════
y += 0.38;
slide.addText('THE ASK', {
  x: M, y, w: 3, h: 0.22,
  fontSize: 9, fontFace: F.m, color: C.sun, bold: true, charSpacing: 4, margin: 0,
});

y += 0.26;
slide.addText([
  { text: 'Pre-seed', options: { color: C.txt, bold: true } },
  { text: '  ·  Advisors (fintech, Solana, academic, diaspora)  ·  ', options: { color: C.txt2 } },
  { text: 'Partners', options: { color: C.txt, bold: true } },
  { text: ' (TTSEC, UWI, Bermuda DABA)', options: { color: C.txt2 } },
], { x: M, y, w: CW, h: 0.2, fontSize: 8, fontFace: F.b, margin: 0 });

y += 0.32;
slide.addShape(pres.shapes.RECTANGLE, {
  x: M, y, w: CW, h: 0.45,
  fill: { color: C.night2 }, line: { color: C.sea, width: 1 },
});
slide.addText([
  { text: 'FDV TARGET: ', options: { color: C.txt2 } },
  { text: '$25M – $100M', options: { color: C.sea, bold: true } },
  { text: '  (24-month horizon)  ·  ', options: { color: C.txt2 } },
  { text: 'Probability-weighted: ~$42M', options: { color: C.sun } },
], {
  x: M + 0.2, y, w: CW - 0.4, h: 0.45,
  fontSize: 11, fontFace: F.h, align: 'center', valign: 'middle', margin: 0,
});

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════
y += 0.65;
slide.addShape(pres.shapes.LINE, {
  x: M, y, w: CW, h: 0,
  line: { color: C.border, width: 0.5 },
});

y += 0.12;
slide.addText([
  { text: 'Built on Solana ◎', options: { color: C.txt2 } },
  { text: '  ·  ', options: { color: C.muted } },
  { text: '@limerscapital', options: { color: C.sea } },
  { text: '  ·  ', options: { color: C.muted } },
  { text: 'docs.limerscapital.com', options: { color: C.coral } },
], {
  x: M, y, w: CW, h: 0.22,
  fontSize: 8, fontFace: F.m, align: 'center', margin: 0,
});

y += 0.22;
slide.addText('Cuzo1Ace  ·  Trinidad & Tobago  ·  X · Instagram · TikTok', {
  x: M, y, w: CW, h: 0.2,
  fontSize: 7, fontFace: F.m, color: C.muted, align: 'center', margin: 0,
});

// ═══════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════
const outPath = path.join(__dirname, '..', 'Limers-Capital-One-Pager.pptx');
pres.writeFile({ fileName: outPath })
  .then(() => {
    console.log(`✓ One-pager written to: ${outPath}`);
    console.log('  1 slide · Letter portrait (7.5" × 10") · investor-ready');
  })
  .catch((err) => {
    console.error('✗ Failed:', err);
    process.exit(1);
  });
