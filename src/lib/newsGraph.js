/**
 * newsGraph — builds the heterogeneous node/edge graph consumed by
 * NewsBubbleMap. Three node layers:
 *
 *   • item   — one node per news_items row (large bubbles)
 *   • ticker — one node per unique ticker across the feed (medium)
 *   • tag    — one node per unique tag (small)
 *
 * Edges (undirected):
 *   • item↔ticker — item.tickers includes ticker
 *   • item↔tag    — item.tags includes tag
 *   • item↔item   — shared tag/ticker OR same UTC day (chosen edge set)
 *
 * The component uses this pure function; no React / d3 imports here so
 * it stays testable and cheap to recompute on filter changes.
 */

const MIN_ITEM_RADIUS = 16;
const MAX_ITEM_RADIUS = 42;
const MIN_TICKER_RADIUS = 12;
const MAX_TICKER_RADIUS = 28;
const MIN_TAG_RADIUS = 8;
const MAX_TAG_RADIUS = 18;

function scale(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return (outMin + outMax) / 2;
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

function sameUtcDay(a, b) {
  if (!a || !b) return false;
  return a.slice(0, 10) === b.slice(0, 10);
}

/**
 * @param {Array} items — feed items (already ranked)
 * @returns {{ nodes: Array, links: Array }} d3-force compatible graph
 */
export function buildNewsGraph(items) {
  if (!items?.length) return { nodes: [], links: [] };

  // ── Aggregate ticker + tag frequencies ─────────────────
  const tickerFreq = new Map();
  const tagFreq = new Map();
  for (const it of items) {
    for (const t of it.tickers || []) {
      const k = String(t).toUpperCase();
      tickerFreq.set(k, (tickerFreq.get(k) || 0) + 1);
    }
    for (const g of it.tags || []) {
      const k = String(g).toLowerCase();
      tagFreq.set(k, (tagFreq.get(k) || 0) + 1);
    }
  }

  // Radius scales
  const priorities = items.map(i => Number(i.priority || 0));
  const pMin = Math.min(...priorities, 0);
  const pMax = Math.max(...priorities, 1);
  const tickerMax = Math.max(...tickerFreq.values(), 1);
  const tagMax = Math.max(...tagFreq.values(), 1);

  // ── Nodes ───────────────────────────────────────────────
  const nodes = [];

  items.forEach((it) => {
    nodes.push({
      id: `item:${it.id}`,
      kind: 'item',
      radius: scale(Number(it.priority || 0), pMin, pMax, MIN_ITEM_RADIUS, MAX_ITEM_RADIUS),
      label: it.title,
      source_name: it.source_name,
      // Store the raw item for click → modal
      item: it,
    });
  });

  for (const [ticker, freq] of tickerFreq.entries()) {
    nodes.push({
      id: `ticker:${ticker}`,
      kind: 'ticker',
      radius: scale(freq, 1, tickerMax, MIN_TICKER_RADIUS, MAX_TICKER_RADIUS),
      label: `$${ticker}`,
      ticker,
      count: freq,
    });
  }

  for (const [tag, freq] of tagFreq.entries()) {
    // Skip very low-signal tags (appear in only one item) to reduce clutter
    if (freq < 1) continue;
    nodes.push({
      id: `tag:${tag}`,
      kind: 'tag',
      radius: scale(freq, 1, tagMax, MIN_TAG_RADIUS, MAX_TAG_RADIUS),
      label: `#${tag}`,
      tag,
      count: freq,
    });
  }

  // ── Links ───────────────────────────────────────────────
  const links = [];
  const linkKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const seen = new Set();
  function addLink(a, b, strength, type) {
    const key = linkKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ source: a, target: b, strength, type });
  }

  // item → ticker, item → tag
  items.forEach((it) => {
    const iid = `item:${it.id}`;
    for (const t of it.tickers || []) {
      addLink(iid, `ticker:${String(t).toUpperCase()}`, 0.6, 'has-ticker');
    }
    for (const g of it.tags || []) {
      addLink(iid, `tag:${String(g).toLowerCase()}`, 0.4, 'has-tag');
    }
  });

  // item ↔ item: shared tag/ticker count + same-day bonus
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j];
      const tagOverlap = (A.tags || []).filter(x => (B.tags || []).includes(x)).length;
      const tkOverlap = (A.tickers || []).filter(x => (B.tickers || []).includes(x)).length;
      const sameDay = sameUtcDay(A.published_at, B.published_at);
      const overlap = tagOverlap + 2 * tkOverlap + (sameDay ? 0.5 : 0);
      if (overlap >= 1) {
        addLink(`item:${A.id}`, `item:${B.id}`, Math.min(1, overlap / 4), 'item-item');
      }
    }
  }

  return { nodes, links };
}

/** Convenience — true if two node IDs are joined by any link. */
export function areConnected(links, idA, idB) {
  const key = idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  return links.some(l => {
    const sid = typeof l.source === 'object' ? l.source.id : l.source;
    const tid = typeof l.target === 'object' ? l.target.id : l.target;
    const k = sid < tid ? `${sid}|${tid}` : `${tid}|${sid}`;
    return k === key;
  });
}

/** All neighbor node-ids of a given node in the link array. */
export function neighborIds(links, nodeId) {
  const out = new Set();
  for (const l of links) {
    const sid = typeof l.source === 'object' ? l.source.id : l.source;
    const tid = typeof l.target === 'object' ? l.target.id : l.target;
    if (sid === nodeId) out.add(tid);
    else if (tid === nodeId) out.add(sid);
  }
  return out;
}
