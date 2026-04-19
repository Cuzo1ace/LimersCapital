/**
 * Portfolio import parsers. Accept CSV or JSON and normalize to:
 *   [{ symbol, qty, price, name?, source? }]
 *
 * We don't enforce strict column order so retail users can drop exports
 * from Robinhood / TD / E*TRADE / manual spreadsheets without editing.
 */

const COLUMN_ALIASES = {
  symbol: ['symbol', 'ticker', 'instrument', 'security'],
  qty:    ['qty', 'quantity', 'shares', 'units', 'amount', 'position'],
  price:  ['price', 'cost', 'avg price', 'avg cost', 'cost basis', 'last', 'current price'],
  name:   ['name', 'security name', 'description'],
};

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function colIndex(headers, key) {
  const aliases = COLUMN_ALIASES[key];
  for (const a of aliases) {
    const i = headers.findIndex(h => h.toLowerCase() === a);
    if (i >= 0) return i;
  }
  return -1;
}

export function parsePortfolioCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (lines.length < 2) throw new Error('CSV needs a header row and at least one position');
  const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
  const idx = {
    symbol: colIndex(headers, 'symbol'),
    qty:    colIndex(headers, 'qty'),
    price:  colIndex(headers, 'price'),
    name:   colIndex(headers, 'name'),
  };
  if (idx.symbol < 0 || idx.qty < 0) {
    throw new Error(`CSV missing required columns (symbol, qty). Found: ${headers.join(', ')}`);
  }

  const positions = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const symbol = (cells[idx.symbol] || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '');
    if (!symbol) continue;
    const qty   = parseFloat(String(cells[idx.qty]   || '').replace(/[,\s$]/g, ''));
    const price = idx.price >= 0 ? parseFloat(String(cells[idx.price] || '').replace(/[,\s$]/g, '')) : 0;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    positions.push({
      symbol,
      qty,
      price: Number.isFinite(price) ? price : 0,
      name:  idx.name >= 0 ? (cells[idx.name] || null) : null,
      source: 'csv',
    });
  }

  return positions;
}

export function parsePortfolioJson(text) {
  const raw = JSON.parse(text);
  const arr = Array.isArray(raw) ? raw
           : Array.isArray(raw.positions) ? raw.positions
           : Array.isArray(raw.holdings)  ? raw.holdings
           : null;
  if (!arr) throw new Error('JSON must be an array or have {positions: [...]}');
  return arr.map(p => ({
    symbol: String(p.symbol || p.ticker || '').toUpperCase(),
    qty:    Number(p.qty || p.quantity || p.shares || 0),
    price:  Number(p.price || p.cost || p.avgPrice || 0),
    name:   p.name || null,
    source: 'json',
  })).filter(p => p.symbol && p.qty > 0);
}

export function parsePortfolioText(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parsePortfolioJson(trimmed);
  }
  return parsePortfolioCsv(trimmed);
}
