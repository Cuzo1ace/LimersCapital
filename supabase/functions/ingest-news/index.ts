// ============================================================
// ingest-news — Supabase Edge Function
//
// Reads active rows from public.news_sources, fetches each RSS feed,
// parses items, dedupes via SHA-256 hash of (title || source_url),
// and inserts into public.news_items with tags/countries/priority
// inherited from the source row.
//
// Optionally runs a Claude Haiku pass to write a 2-sentence summary
// for rows that landed without one, bounded by AI_DAILY_BUDGET_USD.
//
// Scheduled from pg_cron every 30 min; also callable with a POST.
//
// Env (set via `supabase secrets set`):
//   SUPABASE_URL              — injected
//   SUPABASE_SERVICE_ROLE_KEY — injected
//   ANTHROPIC_API_KEY         — optional; if unset, AI pass is skipped
//   AI_DAILY_BUDGET_USD       — default "2.00"
//   AI_MODEL                  — default "claude-haiku-4-5-20251001"
//   MAX_AI_CALLS_PER_TICK     — default "10"
//
// Deploy:
//   supabase functions deploy ingest-news --no-verify-jwt
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.4.1';

// ── Config ──────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const AI_DAILY_BUDGET_USD = Number(Deno.env.get('AI_DAILY_BUDGET_USD') ?? '2.00');
const AI_MODEL = Deno.env.get('AI_MODEL') ?? 'claude-haiku-4-5-20251001';
const MAX_AI_CALLS_PER_TICK = Number(Deno.env.get('MAX_AI_CALLS_PER_TICK') ?? '10');

// Rough cost per call for Claude Haiku 4.5 (input ~300 tok, output ~80 tok).
// We write the exact cost per row; this constant is only used for the
// pre-flight budget guard against today's running sum.
const EST_COST_PER_AI_CALL_USD = 0.0012;

// Auto-pause a source after this many consecutive errors.
const MAX_CONSECUTIVE_ERRORS = 5;

// ── Types ───────────────────────────────────────────────────
interface NewsSource {
  id: string;
  name: string;
  kind: 'rss' | 'x_twitter' | 'scraper' | 'api';
  url: string;
  tags: string[];
  countries: string[];
  priority_boost: number;
  requires_bridge: boolean;
  max_items_per_tick: number;
  fetch_timeout_ms: number;
  consecutive_errors: number;
}

interface ParsedItem {
  title: string;
  link: string | null;
  description: string | null;
  pubDate: string | null;  // ISO
  image: string | null;
}

// ── Utilities ───────────────────────────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function parseDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: {
        // Some RSS providers reject default Deno UA
        'User-Agent': 'LimersCapital-NewsBot/1.0 (+https://limerscapital.com)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// ── RSS parsing ─────────────────────────────────────────────
const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
  cdataPropName: '#cdata',
});

function parseRssXml(body: string): ParsedItem[] {
  const doc = xml.parse(body);

  // RSS 2.0: rss.channel.item
  const rssItems = doc?.rss?.channel?.item;
  if (rssItems) {
    const arr = Array.isArray(rssItems) ? rssItems : [rssItems];
    return arr.map(rssItem);
  }

  // Atom: feed.entry
  const atomEntries = doc?.feed?.entry;
  if (atomEntries) {
    const arr = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    return arr.map(atomEntry);
  }

  return [];
}

function rssItem(it: Record<string, unknown>): ParsedItem {
  const title = typeof it.title === 'object'
    ? (it.title as { '#cdata'?: string })['#cdata'] ?? String(it.title)
    : String(it.title ?? '');
  const description = typeof it.description === 'object'
    ? (it.description as { '#cdata'?: string })['#cdata'] ?? String(it.description)
    : (it.description as string | undefined) ?? null;
  const link = typeof it.link === 'object'
    ? ((it.link as { '#text'?: string; '@_href'?: string })['#text']
       ?? (it.link as { '@_href'?: string })['@_href']
       ?? null)
    : (it.link as string | undefined) ?? null;
  const media = (it['media:content'] as { '@_url'?: string } | undefined)?.['@_url']
    ?? (it.enclosure as { '@_url'?: string } | undefined)?.['@_url']
    ?? null;
  return {
    title: stripHtml(title).slice(0, 500),
    link,
    description: description ? stripHtml(description).slice(0, 1200) : null,
    pubDate: parseDate((it.pubDate ?? it['dc:date']) as string | undefined),
    image: media,
  };
}

// ── Scraper: Solflare /news/ HTML ───────────────────────────
// Solflare renders news cards in a stable, class-based pattern:
//   <li class="c-news-cards-module__single">
//     <div class="c-news-card">
//       <p class="c-news-card__date">Apr 15th 2026</p>
//       <h2 class="c-news-card__title">Title...</h2>
//       <div class="c-news-card__excerpt">Excerpt...</div>
//       <div class="c-news-card__cta"><a href="https://...">Read more</a></div>
// Aggregated links point to external sources (SolanaFloor, etc.) — we
// preserve source_name='Solflare' but use the external URL in source_url.
function parseSolflareHtml(body: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  // Each news card lives inside a single <li class="c-news-cards-module__single">.
  const cardRe = /<li class="c-news-cards-module__single"[^>]*>([\s\S]*?)<\/li>/g;
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(body)) !== null) {
    const card = m[1];
    const titleMatch = card.match(/<h2 class="c-news-card__title[^"]*">\s*([^<]+?)\s*<\/h2>/);
    const dateMatch = card.match(/<p class="c-news-card__date[^"]*">\s*([^<]+?)\s*<\/p>/);
    const excerptMatch = card.match(/<div class="c-news-card__excerpt[^"]*">\s*([^<]+?)\s*<\/div>/);
    // Link within the CTA section — external href
    const linkMatch = card.match(/<div class="c-news-card__cta"[\s\S]*?<a\s+href="([^"]+)"/);
    if (!titleMatch) continue;
    items.push({
      title: stripHtml(titleMatch[1]).slice(0, 500),
      link: linkMatch ? linkMatch[1] : null,
      description: excerptMatch ? stripHtml(excerptMatch[1]).slice(0, 1200) : null,
      pubDate: parseSolflareDate(dateMatch?.[1]),
      image: null,
    });
  }
  return items;
}

// "Apr 15th 2026" → ISO. Tolerant fallback to now() on anything odd.
function parseSolflareDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const cleaned = raw.replace(/(\d+)(st|nd|rd|th)/i, '$1');
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function atomEntry(it: Record<string, unknown>): ParsedItem {
  const title = typeof it.title === 'object'
    ? (it.title as { '#text'?: string })['#text'] ?? String(it.title)
    : String(it.title ?? '');
  const summary = typeof it.summary === 'object'
    ? (it.summary as { '#text'?: string })['#text'] ?? null
    : (it.summary as string | undefined) ?? null;
  const content = typeof it.content === 'object'
    ? (it.content as { '#text'?: string })['#text'] ?? null
    : (it.content as string | undefined) ?? null;
  const linkNode = it.link;
  const link = Array.isArray(linkNode)
    ? (linkNode[0] as { '@_href'?: string })['@_href'] ?? null
    : typeof linkNode === 'object'
      ? (linkNode as { '@_href'?: string })['@_href'] ?? null
      : typeof linkNode === 'string' ? linkNode : null;
  return {
    title: stripHtml(title).slice(0, 500),
    link,
    description: stripHtml(summary ?? content).slice(0, 1200) || null,
    pubDate: parseDate((it.published ?? it.updated) as string | undefined),
    image: null,
  };
}

// ── Anthropic summary pass ───────────────────────────────────
interface ClaudeResult {
  summary: string;
  // Cost estimated from usage field; Anthropic returns `input_tokens` + `output_tokens`
  costUsd: number;
}

async function summarize(item: { title: string; description: string | null }): Promise<ClaudeResult | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const prompt =
`You are a neutral financial-news copy editor for a Caribbean crypto audience.
Write a two-sentence factual brief of the article below.
Rules:
- Exactly two sentences.
- No hype, no adjectives like "massive" or "huge".
- No price predictions.
- No advice.
- Preserve proper nouns and tickers.

Title: ${item.title}
${item.description ? `Context: ${item.description}` : ''}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    console.warn('[summarize] non-200', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = await res.json();
  const summary = (data?.content?.[0]?.text ?? '').trim();
  if (!summary) return null;

  // Haiku 4.5 pricing (April 2026): $1/M input, $5/M output
  const inT = data?.usage?.input_tokens ?? 0;
  const outT = data?.usage?.output_tokens ?? 0;
  const costUsd = (inT * 1 / 1_000_000) + (outT * 5 / 1_000_000);

  return { summary, costUsd };
}

// ── Main handler ─────────────────────────────────────────────
Deno.serve(async (_req: Request) => {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const startedAt = Date.now();
  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let aiCallsMade = 0;
  let aiCostUsd = 0;

  // 1. Load active sources
  const { data: sources, error: srcErr } = await sb
    .from('news_sources')
    .select('*')
    .eq('active', true);
  if (srcErr) {
    return new Response(JSON.stringify({ error: 'sources query failed', detail: srcErr.message }),
      { status: 500, headers: { 'content-type': 'application/json' } });
  }
  if (!sources?.length) {
    return new Response(JSON.stringify({ ok: true, message: 'no active sources' }),
      { headers: { 'content-type': 'application/json' } });
  }

  // 2. Per-source ingest
  for (const src of sources as NewsSource[]) {
    if (src.kind !== 'rss' && src.kind !== 'x_twitter' && src.kind !== 'scraper') {
      // api branch not implemented in this pass
      continue;
    }

    let srcInserted = 0;
    let srcSkipped = 0;
    try {
      const res = await fetchWithTimeout(src.url, src.fetch_timeout_ms);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      // Route by source kind. Solflare is the only scraper for now; the
      // function name is picked explicitly rather than a registry so it's
      // obvious where to add the next scraper (e.g. TTSE).
      let items: ParsedItem[];
      if (src.kind === 'scraper') {
        if (src.url.includes('solflare.com')) {
          items = parseSolflareHtml(body);
        } else {
          throw new Error(`No scraper implemented for host in ${src.url}`);
        }
      } else {
        items = parseRssXml(body);
      }
      items = items.slice(0, src.max_items_per_tick);
      totalFetched += items.length;

      for (const item of items) {
        if (!item.title) continue;
        const dedupKey = `${item.title.toLowerCase()}||${item.link ?? ''}`;
        const dedup_hash = await sha256Hex(dedupKey);

        const row = {
          source_type: 'rss' as const,
          source_name: src.name,
          source_url: item.link,
          title: item.title,
          summary: item.description,
          hero_image: item.image,
          tags: src.tags,
          countries: src.countries,
          priority: src.priority_boost,
          published_at: item.pubDate,
          dedup_hash,
        };
        const { error: insErr } = await sb
          .from('news_items')
          .insert(row);
        if (insErr) {
          // Unique violation on dedup_hash = already have it
          if (insErr.code === '23505') { srcSkipped += 1; continue; }
          throw new Error(`insert failed: ${insErr.message}`);
        }
        srcInserted += 1;
      }

      // Telemetry: success
      await sb.from('news_sources')
        .update({
          last_success_at: new Date().toISOString(),
          last_error: null,
          consecutive_errors: 0,
        })
        .eq('id', src.id);

      totalInserted += srcInserted;
      totalSkipped += srcSkipped;
      console.log(`[ingest] ${src.name}: +${srcInserted} / skip ${srcSkipped}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const nextCount = (src.consecutive_errors ?? 0) + 1;
      const shouldPause = nextCount >= MAX_CONSECUTIVE_ERRORS;
      await sb.from('news_sources')
        .update({
          last_error: msg.slice(0, 500),
          last_error_at: new Date().toISOString(),
          consecutive_errors: nextCount,
          active: shouldPause ? false : src.active !== false,
        })
        .eq('id', src.id);
      console.warn(`[ingest] ${src.name} FAILED: ${msg}${shouldPause ? ' — AUTO-PAUSED' : ''}`);
    }
  }

  // 3. Optional AI summary pass — only if key is set
  if (ANTHROPIC_API_KEY && totalInserted > 0) {
    // Pre-flight budget check: today's running cost
    const today = new Date().toISOString().slice(0, 10);
    const { data: spendRows } = await sb
      .from('news_items')
      .select('ai_cost_usd')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .not('ai_cost_usd', 'is', null);
    const spentToday = (spendRows ?? []).reduce((s, r) => s + Number(r.ai_cost_usd ?? 0), 0);
    const budgetRemaining = AI_DAILY_BUDGET_USD - spentToday;

    if (budgetRemaining <= EST_COST_PER_AI_CALL_USD) {
      console.log(`[ai] daily budget reached ($${spentToday.toFixed(4)}/$${AI_DAILY_BUDGET_USD}) — skipping`);
    } else {
      const affordableCalls = Math.min(
        MAX_AI_CALLS_PER_TICK,
        Math.floor(budgetRemaining / EST_COST_PER_AI_CALL_USD),
      );
      // Pick rows inserted this tick that don't yet have an AI summary and have a long enough title
      const { data: candidates } = await sb
        .from('news_items')
        .select('id, title, summary')
        .is('ai_model', null)
        .eq('source_type', 'rss')
        .order('created_at', { ascending: false })
        .limit(affordableCalls);

      for (const row of candidates ?? []) {
        const result = await summarize({ title: row.title, description: row.summary });
        if (!result) continue;
        aiCallsMade += 1;
        aiCostUsd += result.costUsd;
        await sb.from('news_items')
          .update({
            summary: result.summary,
            source_type: 'ai_summary',
            ai_model: AI_MODEL,
            ai_cost_usd: result.costUsd,
          })
          .eq('id', row.id);
      }
    }
  }

  const durationMs = Date.now() - startedAt;
  return new Response(JSON.stringify({
    ok: true,
    sources: sources.length,
    fetched: totalFetched,
    inserted: totalInserted,
    skipped: totalSkipped,
    ai_calls: aiCallsMade,
    ai_cost_usd: Number(aiCostUsd.toFixed(6)),
    duration_ms: durationMs,
  }), { headers: { 'content-type': 'application/json' } });
});
