// TTSE data via self-hosted Cloudflare Worker proxy + fallback cache
//
// Worker returns HTML directly. Set VITE_TTSE_PROXY_URL in .env.local after deploying:
//   cd workers && wrangler deploy ttse-proxy.js --name ttse-proxy
//   VITE_TTSE_PROXY_URL=https://ttse-proxy.<subdomain>.workers.dev
//
// Falls back to hardcoded snapshot if Worker is unavailable.

const TTSE_PROXY_URL =
  import.meta.env.VITE_TTSE_PROXY_URL || null;

// Legacy fallback (allorigins) — only used if Worker URL is not configured
const ALLORIGINS_BASE = 'https://api.allorigins.win/get?url=';
const TTSE_URL = 'https://www.stockex.co.tt/market-quote/';

export const TTD_RATE = 6.79; // 1 USD ≈ TT$6.79

export const SECTOR_META = {
  bank:   { icon: '\u{1F3E6}', label: 'Banking',       cls: 'text-[#7EB2FF] border-[#7EB2FF]/30 bg-[#7EB2FF]/7' },
  energy: { icon: '\u26A1',    label: 'Energy',         cls: 'text-sun border-sun/30 bg-sun/7' },
  congl:  { icon: '\u{1F537}', label: 'Conglomerate',   cls: 'text-[#C87EFF] border-[#C87EFF]/30 bg-[#C87EFF]/7' },
  food:   { icon: '\u{1F33E}', label: 'Food & Bev',     cls: 'text-palm border-palm/30 bg-palm/7' },
  prop:   { icon: '\u{1F3E0}', label: 'Property',       cls: 'text-coral border-coral/30 bg-coral/7' },
  media:  { icon: '\u{1F4FA}', label: 'Media',          cls: 'text-sea border-border bg-sea/7' },
};

const SECTOR_MAP = {
  AGL:'congl', AHL:'food', AMBL:'bank', AMCL:'congl', ASBH:'congl',
  CIBC:'bank', FCGFH:'bank', GHL:'bank', GKC:'congl', GML:'media',
  JMMBGL:'bank', MASSY:'congl', NCBFG:'bank', NEL:'energy', NFM:'food',
  NGL:'energy', OCM:'media', PHL:'food', PLD:'energy', RFHL:'bank',
  SBTT:'bank', TCL:'congl', UCL:'food', WCO:'congl',
};

// Fallback data scraped 24 Mar 2026
export const TTSE_FALLBACK = [
  { sym:'AGL',   name:'Agostini Limited',            open:61.79, close:61.79, chg:0.00,  vol:0,      sector:'congl' },
  { sym:'AHL',   name:'Angostura Holdings',           open:10.91, close:10.89, chg:-0.02, vol:296,    sector:'food'  },
  { sym:'AMBL',  name:'ANSA Merchant Bank',            open:24.22, close:24.22, chg:0.00,  vol:0,      sector:'bank'  },
  { sym:'AMCL',  name:'ANSA McAL Limited',             open:37.26, close:37.26, chg:0.00,  vol:160,    sector:'congl' },
  { sym:'ASBH',  name:'A.S. Bryden & Sons',            open:1.40,  close:1.40,  chg:0.00,  vol:65,     sector:'congl' },
  { sym:'CIBC',  name:'CIBC Caribbean Bank',           open:8.25,  close:8.28,  chg:0.03,  vol:4244,   sector:'bank'  },
  { sym:'FCGFH', name:'First Citizens Group',          open:34.59, close:34.99, chg:0.40,  vol:3338,   sector:'bank'  },
  { sym:'GHL',   name:'Guardian Holdings',             open:15.07, close:15.22, chg:0.15,  vol:282,    sector:'bank'  },
  { sym:'GKC',   name:'GraceKennedy Limited',          open:3.27,  close:3.26,  chg:-0.01, vol:20000,  sector:'congl' },
  { sym:'GML',   name:'Guardian Media Limited',        open:0.68,  close:0.68,  chg:0.00,  vol:300,    sector:'media' },
  { sym:'JMMBGL',name:'JMMB Group Limited',            open:0.83,  close:0.83,  chg:0.00,  vol:0,      sector:'bank'  },
  { sym:'MASSY', name:'Massy Holdings Ltd',            open:3.35,  close:3.36,  chg:0.01,  vol:5969,   sector:'congl' },
  { sym:'NCBFG', name:'NCB Financial Group',           open:1.97,  close:1.97,  chg:0.00,  vol:0,      sector:'bank'  },
  { sym:'NEL',   name:'National Enterprises',          open:3.68,  close:3.70,  chg:0.02,  vol:23488,  sector:'energy'},
  { sym:'NFM',   name:'National Flour Mills',          open:1.49,  close:1.49,  chg:0.00,  vol:2,      sector:'food'  },
  { sym:'NGL',   name:'TT NGL Limited',                open:9.36,  close:9.10,  chg:-0.26, vol:14966,  sector:'energy'},
  { sym:'OCM',   name:'One Caribbean Media',           open:1.30,  close:1.30,  chg:0.00,  vol:0,      sector:'media' },
  { sym:'PHL',   name:'Prestige Holdings',             open:12.40, close:12.40, chg:0.00,  vol:0,      sector:'food'  },
  { sym:'PLD',   name:'Point Lisas Industrial Port',   open:6.30,  close:6.30,  chg:0.00,  vol:83,     sector:'energy'},
  { sym:'RFHL',  name:'Republic Financial Holdings',   open:106.07,close:106.11,chg:0.04,  vol:20442,  sector:'bank'  },
  { sym:'SBTT',  name:'Scotiabank Trinidad & Tobago',  open:45.50, close:45.50, chg:0.00,  vol:2199,   sector:'bank'  },
  { sym:'TCL',   name:'Trinidad Cement Limited',       open:1.60,  close:1.60,  chg:0.00,  vol:0,      sector:'congl' },
  { sym:'UCL',   name:'Unilever Caribbean',            open:13.00, close:13.00, chg:0.00,  vol:0,      sector:'food'  },
  { sym:'WCO',   name:'West Indian Tobacco',           open:2.40,  close:2.41,  chg:0.01,  vol:46903,  sector:'congl' },
];

export const TTSE_INDICES_FALLBACK = {
  composite: { val: 933.22, chg: 1.84 },
  alltt:     { val: 1329.02, chg: 1.72 },
  cxni:      { val: 936.93, chg: -2.56 },
  cross:     { val: 69.24, chg: 0.11 },
};

function parseTTSE(html) {
  const dp = new DOMParser();
  const doc = dp.parseFromString(html, 'text/html');
  const stocks = [];
  const indices = {};

  const tables = doc.querySelectorAll('table');
  for (const tbl of tables) {
    for (const row of tbl.querySelectorAll('tr')) {
      const cells = [...row.querySelectorAll('td')];
      if (cells.length < 12) continue;
      const link = cells[1]?.querySelector('a');
      if (!link || !link.href.includes('manage-stock')) continue;
      const sym = link.textContent.trim().replace(/\s*\(.*\)$/, '').trim();
      const close = parseFloat(cells[11]?.textContent?.trim());
      const open = parseFloat(cells[2]?.textContent?.trim()) || close;
      const chg = parseFloat(cells[12]?.textContent?.trim()) || 0;
      const vol = parseInt((cells[10]?.textContent?.trim() || '').replace(/,/g, '')) || 0;
      if (isNaN(close) || !sym) continue;
      const fb = TTSE_FALLBACK.find(s => s.sym === sym);
      stocks.push({ sym, name: fb?.name || sym, open, close, chg, vol, sector: SECTOR_MAP[sym] || 'congl' });
    }
  }

  for (const row of doc.querySelectorAll('table tr')) {
    const cells = [...row.querySelectorAll('td')];
    if (cells.length < 3) continue;
    const label = cells[1]?.textContent?.trim().toUpperCase();
    const val = parseFloat(cells[2]?.textContent?.replace(/,/g, ''));
    const chg = parseFloat(cells[3]?.textContent);
    if (isNaN(val)) continue;
    if (label?.includes('COMPOSITE')) indices.composite = { val, chg: chg || 0 };
    else if (label?.includes('ALL T&T')) indices.alltt = { val, chg: chg || 0 };
    else if (label?.includes('CXNI') || label?.includes('CARIBBE')) indices.cxni = { val, chg: chg || 0 };
    else if (label?.includes('CROSS')) indices.cross = { val, chg: chg || 0 };
  }
  return { stocks, indices };
}

/**
 * Fetch live TTSE market data.
 *
 * Priority chain:
 *   1. Cloudflare Worker (VITE_TTSE_PROXY_URL) — returns HTML directly
 *   2. allorigins.win fallback — returns { contents: html } JSON (if Worker not configured)
 *   3. Hardcoded snapshot — when all network fetches fail
 */
export async function fetchTTSEData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    let html = null;

    if (TTSE_PROXY_URL) {
      // Path 1: Cloudflare Worker — direct HTML response
      const r = await fetch(TTSE_PROXY_URL, { signal: controller.signal });
      clearTimeout(timeout);
      if (r.ok) {
        html = await r.text();
      }
    } else {
      // Path 2: allorigins legacy fallback (JSON wrapper)
      const r = await fetch(
        `${ALLORIGINS_BASE}${encodeURIComponent(TTSE_URL)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      const j = await r.json();
      if (j.contents) html = j.contents;
    }

    if (html) {
      const parsed = parseTTSE(html);
      if (parsed.stocks.length > 0) {
        return { stocks: parsed.stocks, indices: parsed.indices, live: true };
      }
    }
  } catch {
    clearTimeout(timeout);
  }

  // Path 3: hardcoded snapshot
  return { stocks: TTSE_FALLBACK, indices: TTSE_INDICES_FALLBACK, live: false };
}

export function getTTSEMarketStatus() {
  const now = new Date();
  // Convert to AST (UTC-4)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ast = new Date(utc - 4 * 3600000);
  const day = ast.getDay();
  const mins = ast.getHours() * 60 + ast.getMinutes();
  const isOpen = day >= 1 && day <= 5 && mins >= 570 && mins < 750; // 9:30-12:30
  return { isOpen, timeStr: 'Mon\u2013Fri, 9:30 AM \u2013 12:30 PM (AST)' };
}
