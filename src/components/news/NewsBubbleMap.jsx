import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { drag as d3drag } from 'd3-drag';
import useStore from '../../store/useStore';
import { buildNewsGraph, neighborIds } from '../../lib/newsGraph';
import { getSourceBrand } from '../../lib/newsBrand';
import { getTickerAsset, svgToDataUri } from '../../lib/tickerAssets';
import NewsPreviewModal from './NewsPreviewModal';
import BubblePopover from './BubblePopover';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// Lightens a hex (#RRGGBB) color toward white by `amount` (0-1).
function lighten(hex, amount = 0.5) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${((1 << 24) | (lr << 16) | (lg << 8) | lb).toString(16).slice(1)}`;
}
// Node IDs contain colons (e.g. "item:uuid") — escape to a form safe for
// SVG id / url(#…) references.
function cssId(raw) {
  return String(raw).replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Keep the popover inside the graph viewport so it never clips off the
// right or bottom edge. Width/height constants mirror BubblePopover.
const POPOVER_W = 320;
const POPOVER_H = 280;
function clampX(x, w) { return Math.max(8, Math.min(x, w - POPOVER_W - 8)); }
function clampY(y, h) { return Math.max(8, Math.min(y, h - POPOVER_H - 8)); }

function darken(hex, amount = 0.5) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#000000';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `#${((1 << 24) | (dr << 16) | (dg << 8) | db).toString(16).slice(1)}`;
}

/**
 * Bubblemaps-inspired news visualization.
 * Three node layers (item / ticker / tag) in a force-directed graph.
 * Pan + zoom + drag + search + hover highlighting + mini-map.
 *
 * Single-SVG architecture:
 *   <svg>                   <- root; captures zoom/pan via d3-zoom
 *     <g class="world">     <- transformed by zoom; holds the whole graph
 *       <line>...           <- edges
 *       <circle>...         <- nodes
 *       <text>...           <- labels
 *     </g>
 *     <g class="minimap">   <- NOT transformed; fixed-position overlay
 *   </svg>
 *
 * Mouse on any node fires d3-drag (which suppresses click if moved).
 * A plain React onClick on each circle is kept as the action handler
 * because d3-drag on a short tap does NOT suppress it.
 */

const WIDTH_DEFAULT = 900;
const HEIGHT_DEFAULT = 620;
const MINIMAP_W = 160;
const MINIMAP_H = 110;

function nodeFill(n) {
  if (n.kind === 'item') {
    const b = getSourceBrand(n.source_name);
    return b.accent;
  }
  if (n.kind === 'ticker') return '#00ffa3';  // brand green
  return '#bf81ff';                            // brand purple for tags
}

function nodeStroke(n) {
  return n.kind === 'item' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.22)';
}

export default function NewsBubbleMap({ items, onFilterChipChange, onSwitchToGrid }) {
  const svgRef = useRef(null);
  const worldRef = useRef(null);
  const minimapRef = useRef(null);
  const simRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const visitedNewsItems = useStore(s => s.visitedNewsItems);
  const markNewsItemVisited = useStore(s => s.markNewsItemVisited);
  const [dims, setDims] = useState({ w: WIDTH_DEFAULT, h: HEIGHT_DEFAULT });
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [hoverId, setHoverId] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, k: 1 });
  // Popover: the node whose click-card is open, plus its current screen
  // position. The position follows the bubble while the simulation is
  // still cooling down; stays fixed after settle (rare user drags break
  // the link, which is fine — they can click again).
  const [popoverNode, setPopoverNode] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  // Screen-space center+radius of the currently selected bubble — drives
  // the SVG ring halo overlay so it tracks the bubble through the force
  // simulation, drags, and zoom/pan. Shape: { cx, cy, r } in container coords.
  const [highlightBox, setHighlightBox] = useState(null);
  // Latest node positions keyed by id — written on every sim tick, read
  // by the popover-position effect below.
  const nodePositionsRef = useRef(new Map());

  // Build graph data — memoized on items
  const graph = useMemo(() => buildNewsGraph(items), [items]);

  // Track container width for responsive layout
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setDims({
        w: Math.max(320, rect.width),
        h: Math.max(420, Math.min(720, rect.width * 0.68)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Precompute neighbor lookup for hover highlighting
  const neighborsById = useMemo(() => {
    const m = new Map();
    for (const n of graph.nodes) m.set(n.id, new Set([n.id]));
    for (const l of graph.links) {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      m.get(sid)?.add(tid);
      m.get(tid)?.add(sid);
    }
    return m;
  }, [graph]);

  // Filtered/highlighted set from search
  const matchingIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out = new Set();
    for (const n of graph.nodes) {
      if ((n.label || '').toLowerCase().includes(q)) out.add(n.id);
      if (n.kind === 'item' && (n.item?.summary || '').toLowerCase().includes(q)) out.add(n.id);
    }
    return out;
  }, [graph.nodes, query]);

  // Effective dimmed set (search narrows first, then hover further narrows)
  const activeIds = useMemo(() => {
    if (hoverId) return neighborsById.get(hoverId) || new Set([hoverId]);
    return matchingIds;
  }, [hoverId, matchingIds, neighborsById]);

  // ── D3 simulation + rendering ─────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    if (!graph.nodes.length) return;

    const svg = select(svgRef.current);
    const world = select(worldRef.current);

    // Clear world on each graph update
    world.selectAll('*').remove();

    // Layout passes
    const nodeData = graph.nodes.map(n => ({ ...n }));
    const linkData = graph.links.map(l => ({ ...l }));

    const sim = forceSimulation(nodeData)
      .force('link', forceLink(linkData).id(d => d.id).distance(l => {
        if (l.type === 'has-ticker') return 70;
        if (l.type === 'has-tag') return 85;
        return 110;
      }).strength(l => l.strength || 0.3))
      .force('charge', forceManyBody().strength(d => -120 - d.radius * 4))
      .force('center', forceCenter(dims.w / 2, dims.h / 2))
      .force('collide', forceCollide().radius(d => d.radius + 4).iterations(2))
      .force('x', forceX(dims.w / 2).strength(0.04))
      .force('y', forceY(dims.h / 2).strength(0.04));
    simRef.current = sim;

    // ── Defs: holographic gradients + glow filter + image clips ────
    const defs = world.append('defs');

    // Shared soft outer glow. Browsers render one filter instance
    // efficiently even when applied to many elements.
    const glow = defs.append('filter')
      .attr('id', 'holo-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Per-node gradient — 3 stops (highlight, accent, deep shade) for the
    // glass-sphere look. Iridescence comes from the CSS @keyframes
    // hue-rotate applied via the bubble-holo class below.
    nodeData.forEach(n => {
      const accent = nodeFill(n);
      const grad = defs.append('radialGradient')
        .attr('id', `grad-${cssId(n.id)}`)
        .attr('cx', '35%').attr('cy', '30%').attr('r', '75%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', lighten(accent, 0.7)).attr('stop-opacity', 0.95);
      grad.append('stop').attr('offset', '45%').attr('stop-color', accent).attr('stop-opacity', n.kind === 'item' ? 0.95 : 0.8);
      grad.append('stop').attr('offset', '100%').attr('stop-color', darken(accent, 0.55)).attr('stop-opacity', 0.95);

      // Circular clip per node — used for ticker images
      defs.append('clipPath')
        .attr('id', `clip-${cssId(n.id)}`)
        .append('circle')
        .attr('r', n.radius);
    });

    // ── Edges ────────────────────────────────────────────────────
    const linkSel = world.append('g').attr('class', 'links').selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.10)')
      .attr('stroke-width', d => 0.5 + d.strength * 1.8);

    // ── Nodes ────────────────────────────────────────────────────
    const nodeG = world.append('g').attr('class', 'nodes').selectAll('g')
      .data(nodeData, d => d.id)
      .join('g')
      .attr('class', d => `bubble bubble-${d.kind} bubble-holo`)
      .style('cursor', 'pointer')
      .attr('filter', 'url(#holo-glow)');

    // Base sphere — radial gradient fill
    nodeG.append('circle')
      .attr('class', 'bubble-sphere')
      .attr('r', d => d.radius)
      .attr('fill', d => `url(#grad-${cssId(d.id)})`)
      .attr('stroke', 'rgba(255,255,255,0.18)')
      .attr('stroke-width', 1.2);

    // Ticker images (if available) — layered above the sphere, clipped to circle
    nodeG.filter(d => d.kind === 'ticker')
      .each(function (d) {
        const { externalPath, inlineSvg } = getTickerAsset(d.ticker);
        const node = select(this);
        const href = externalPath || svgToDataUri(inlineSvg);
        if (!href) return;
        const img = node.append('image')
          .attr('class', 'ticker-art')
          .attr('href', href)
          .attr('xlink:href', href)  // for older Safari/Firefox
          .attr('clip-path', `url(#clip-${cssId(d.id)})`)
          .attr('x', -d.radius)
          .attr('y', -d.radius)
          .attr('width', d.radius * 2)
          .attr('height', d.radius * 2)
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .style('pointer-events', 'none');
        // If an external file is the first preference but missing, fall
        // back to the inline SVG on error.
        if (externalPath && inlineSvg) {
          img.on('error', () => {
            img.attr('href', svgToDataUri(inlineSvg))
               .attr('xlink:href', svgToDataUri(inlineSvg));
          });
        }
      });

    // Top-left specular highlight — gives the "3D glass sphere" pop.
    // A per-node animation-delay staggers the shimmer so the field doesn't
    // pulse in unison.
    nodeG.append('ellipse')
      .attr('class', 'bubble-highlight')
      .attr('cx', d => -d.radius * 0.32)
      .attr('cy', d => -d.radius * 0.4)
      .attr('rx', d => d.radius * 0.45)
      .attr('ry', d => d.radius * 0.22)
      .attr('fill', 'rgba(255,255,255,0.35)')
      .style('pointer-events', 'none')
      .style('animation-delay', (_d, i) => `${(i % 11) * 0.4}s`);

    // Text label — only tickers WITHOUT an image get a text label (image
    // replaces the text); tags always get their text label.
    nodeG.filter(d => {
      if (d.kind === 'item') return false;
      if (d.kind === 'tag') return true;
      // ticker without any art → show text
      const { externalPath, inlineSvg } = getTickerAsset(d.ticker);
      return !externalPath && !inlineSvg;
    }).append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#0d0e10')
      .attr('font-size', d => d.kind === 'ticker' ? 11 : 9)
      .attr('font-weight', 700)
      .attr('font-family', 'DM Mono, monospace')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Source-brand glyph centered on each item bubble — gives every news
    // bubble a visible identity even when many items share the same accent.
    nodeG.filter(d => d.kind === 'item')
      .append('text')
      .text(d => getSourceBrand(d.source_name).glyph)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => Math.max(11, d.radius * 0.7))
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Drag behavior — uses d3-drag (plays nice with SVG + click)
    const dragBehavior = d3drag()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        // Hold position after drag (nicer than snap-back). User can double-click to release.
      });
    nodeG.call(dragBehavior);

    // Click / hover
    nodeG.on('click', (_event, d) => handleNodeClick(d));
    nodeG.on('dblclick', (_event, d) => {
      // Double-click releases a pinned node back to physics
      d.fx = null;
      d.fy = null;
      sim.alphaTarget(0.2).restart();
      setTimeout(() => sim.alphaTarget(0), 500);
    });
    nodeG.on('mouseenter', (_event, d) => setHoverId(d.id));
    nodeG.on('mouseleave', () => setHoverId(null));

    // Simulation tick: update positions. Also stash current world coords
    // per-node so the popover-position effect can track a live bubble.
    sim.on('tick', () => {
      linkSel
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      nodeG.attr('transform', d => {
        nodePositionsRef.current.set(d.id, { x: d.x, y: d.y, radius: d.radius });
        return `translate(${d.x},${d.y})`;
      });
    });

    // Cool the sim down after it settles for perf
    const settleTimer = setTimeout(() => sim.alphaTarget(0), 2500);

    // Zoom + pan
    const zoomBehavior = d3zoom()
      .scaleExtent([0.25, 4])
      .filter((event) => {
        // Only zoom/pan from the SVG background, not from nodes
        return !event.target.closest('g.nodes');
      })
      .on('zoom', (event) => {
        world.attr('transform', event.transform);
        setViewport({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });
    svg.call(zoomBehavior);

    // Expose a reset-zoom for the toolbar
    svg.node().__resetZoom = () => svg.transition().duration(400).call(zoomBehavior.transform, zoomIdentity);

    return () => {
      clearTimeout(settleTimer);
      sim.stop();
    };
    // Rebuild whenever the graph structure changes or canvas resizes.
  }, [graph, dims.w, dims.h]);

  // Track the popover anchor + highlight overlay position. We read the
  // bubble's screen-space rect directly from the live SVG element each
  // frame — robust to d3 sim cycles, HMR, drags, and zoom/pan.
  useEffect(() => {
    if (!popoverNode) {
      setHighlightBox(null);
      return;
    }
    let raf = 0;
    const update = () => {
      const svgEl = svgRef.current;
      if (svgEl) {
        // Find the rendered <g class="bubble"> for this node by datum id
        const target = Array.from(svgEl.querySelectorAll('g.bubble'))
          .find(g => g.__data__?.id === popoverNode.id);
        if (target) {
          const tr = target.getBoundingClientRect();
          const sr = svgEl.getBoundingClientRect();
          const cx = tr.left + tr.width / 2 - sr.left;
          const cy = tr.top + tr.height / 2 - sr.top;
          const r = tr.width / 2;
          // Popover anchors just below + right of the bubble.
          setPopoverPos({ x: cx + r + 8, y: cy + r + 8 });
          // Halo: bubble center + radius in container coords.
          setHighlightBox({ cx, cy, r });
        }
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [popoverNode, viewport]);

  // Apply hover/search highlighting — doesn't need simulation rebuild
  useEffect(() => {
    const world = select(worldRef.current);
    const active = activeIds;
    world.selectAll('g.bubble')
      .attr('opacity', d => (!active || active.has(d.id)) ? 1 : 0.15);
    world.selectAll('g.links line')
      .attr('stroke-opacity', l => {
        if (!active) return 0.4;
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        const both = active.has(sid) && active.has(tid);
        return both ? 0.6 : 0.05;
      });
  }, [activeIds]);

  // Apply "visited" styling — dim the bubble fill and add a small ✓ badge
  // so users can see at a glance which news items they've already opened.
  // Runs whenever the visited set or graph changes; doesn't rebuild the sim.
  useEffect(() => {
    const world = select(worldRef.current);
    if (world.empty()) return;
    const visitedSet = new Set(visitedNewsItems);

    world.selectAll('g.bubble-item').each(function (d) {
      const isVisited = d.item?.id && visitedSet.has(d.item.id);
      const node = select(this);
      // Dim the sphere + desaturate
      node.select('circle.bubble-sphere')
        .attr('fill-opacity', isVisited ? 0.45 : 1)
        .attr('stroke', isVisited ? 'rgba(0,255,163,0.55)' : 'rgba(255,255,255,0.18)')
        .attr('stroke-width', isVisited ? 1.6 : 1.2);

      // Add or remove the visited ✓ badge (top-right of bubble)
      const existing = node.select('g.visited-badge');
      if (isVisited && existing.empty()) {
        const badge = node.append('g').attr('class', 'visited-badge')
          .attr('transform', `translate(${d.radius * 0.65},${-d.radius * 0.65})`)
          .style('pointer-events', 'none');
        badge.append('circle')
          .attr('r', 7)
          .attr('fill', '#00ffa3')
          .attr('stroke', '#0d0e10')
          .attr('stroke-width', 1.5);
        badge.append('text')
          .text('✓')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.32em')
          .attr('font-size', 9)
          .attr('font-weight', 700)
          .attr('fill', '#0d0e10')
          .attr('font-family', 'DM Mono, monospace');
      } else if (!isVisited && !existing.empty()) {
        existing.remove();
      }
    });
  }, [visitedNewsItems, graph]);

  function handleNodeClick(d) {
    // d3 event listeners run outside React's auto-batched event path in
    // some React 18 code paths; queueMicrotask defers the setState so
    // React reliably schedules a re-render.
    queueMicrotask(() => {
      // Mark item bubbles as visited so the user can see at a glance
      // which news items they've already navigated.
      if (d.kind === 'item' && d.item?.id) {
        markNewsItemVisited(d.item.id);
      }
      // New UX: every click opens the popover card. The card's own
      // buttons trigger the downstream actions (modal, filter, etc.).
      setPopoverNode(d);
    });
  }

  function resetZoom() {
    svgRef.current?.__resetZoom?.();
  }

  // Mini-map — fixed viewport in top-right corner.
  // We don't render live bubbles in the minimap (too expensive) — just the
  // bounding viewport rectangle against a static background.
  const minimapViewBox = useMemo(() => {
    // Derive what portion of the world is currently visible
    const { x, y, k } = viewport;
    const visibleW = dims.w / k;
    const visibleH = dims.h / k;
    const visibleX = -x / k;
    const visibleY = -y / k;
    return { visibleX, visibleY, visibleW, visibleH };
  }, [viewport, dims]);

  const graphNodeCount = graph.nodes.length;
  const itemCount = graph.nodes.filter(n => n.kind === 'item').length;
  const tickerCount = graph.nodes.filter(n => n.kind === 'ticker').length;
  const tagCount = graph.nodes.filter(n => n.kind === 'tag').length;

  // Sources actually present in the current feed — drives the per-source legend.
  const presentSources = useMemo(() => {
    const set = new Set();
    for (const n of graph.nodes) {
      if (n.kind === 'item' && n.source_name) set.add(n.source_name);
    }
    return [...set].slice(0, 8);
  }, [graph]);

  return (
    <div className="relative rounded-2xl border border-border overflow-hidden bg-[var(--color-night-2)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border bg-[rgba(13,14,16,0.65)] backdrop-blur-md">
        <span className="text-[.66rem] uppercase tracking-widest text-muted font-headline">🫧 News Map</span>
        <span className="text-[.62rem] text-muted font-mono">
          {itemCount} items · {tickerCount} tickers · {tagCount} tags
        </span>

        <div className="ml-auto flex items-center gap-2">
          <input
            type="search"
            placeholder="Search bubbles…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="text-[.72rem] bg-white/5 border border-border rounded-md px-2.5 py-1 text-txt placeholder:text-muted focus:outline-none focus:border-sea/40 w-40"
          />
          <button
            onClick={resetZoom}
            className="text-[.66rem] uppercase tracking-widest font-headline text-muted hover:text-txt bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer transition-colors"
            title="Reset view"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="relative" style={{ width: '100%', height: dims.h }}>
        <svg
          ref={svgRef}
          width="100%"
          height={dims.h}
          style={{ display: 'block', cursor: 'grab' }}
          onMouseDown={e => { e.currentTarget.style.cursor = 'grabbing'; }}
          onMouseUp={e => { e.currentTarget.style.cursor = 'grab'; }}
          onMouseLeave={e => { e.currentTarget.style.cursor = 'grab'; }}
          onClick={e => {
            // Background click closes the popover (ignore if it originated
            // inside a bubble group — those are handled by d3's on('click')).
            if (popoverNode && !e.target.closest('g.bubble')) {
              setPopoverNode(null);
            }
          }}
        >
          <defs>
            <radialGradient id="bubble-bg" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(0,255,163,0.06)" />
              <stop offset="100%" stopColor="rgba(13,14,16,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bubble-bg)" />
          <g ref={worldRef} />
        </svg>

        {/* Selected-bubble halo — thin sea-green inner ring + two pinging
            outer rings. SVG strokes scale crisply at any bubble radius and
            sit cleanly over any source colour. SMIL animations drive the
            shimmer + pings (more reliable for SVG attrs than framer-motion
            in this codebase). */}
        {highlightBox && popoverNode && (() => {
          const { cx, cy, r } = highlightBox;
          const pingRange = Math.max(10, r * 0.5);
          // Bound the SVG to a rect that covers the largest ping radius.
          const reach = r + 3 + pingRange + 4;
          const left = cx - reach;
          const top = cy - reach;
          const size = reach * 2;
          // Translate centre coords into local SVG coords.
          const lx = reach;
          const ly = reach;
          const baseR = r + 3;
          const farR = baseR + pingRange;
          return (
            <svg
              width={size}
              height={size}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left,
                top,
                pointerEvents: 'none',
                zIndex: 5,
                overflow: 'visible',
              }}
            >
              <defs>
                <filter id="halo-soft" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.2" />
                </filter>
              </defs>

              {/* Stable inner ring — marks "this is selected" */}
              <circle
                className="bubble-halo-shimmer"
                cx={lx}
                cy={ly}
                r={baseR}
                fill="none"
                stroke="#00ffa3"
                strokeWidth={1.5}
                strokeOpacity={0.9}
                filter="url(#halo-soft)"
              />

              {/* Two staggered ping rings — communicates "active / live".
                  CSS scales them outward from baseR to baseR*1.7. */}
              <circle
                className="bubble-halo-ping"
                cx={lx}
                cy={ly}
                r={baseR}
                fill="none"
                stroke="#00ffa3"
                strokeWidth={1}
                strokeOpacity={0.55}
              />
              <circle
                className="bubble-halo-ping bubble-halo-ping--delayed"
                cx={lx}
                cy={ly}
                r={baseR}
                fill="none"
                stroke="#00ffa3"
                strokeWidth={1}
                strokeOpacity={0.55}
              />
            </svg>
          );
        })()}

        {/* Popover card anchored to the active bubble */}
        <AnimatePresence>
          {popoverNode && (
            <BubblePopover
              key={popoverNode.id}
              node={popoverNode}
              items={items}
              style={{
                left: clampX(popoverPos.x, dims.w),
                top: clampY(popoverPos.y, dims.h),
              }}
              onClose={() => setPopoverNode(null)}
              onOpenModal={(item) => {
                setPopoverNode(null);
                setSelected(item);
              }}
              onFilterFeed={(chip) => {
                setPopoverNode(null);
                onFilterChipChange?.(chip);
                onSwitchToGrid?.();
              }}
              onOpenItem={(item) => {
                // Switch popover to the related item so users can hop around
                const next = graph.nodes.find(n => n.kind === 'item' && n.item?.id === item.id);
                if (next) setPopoverNode(next);
              }}
            />
          )}
        </AnimatePresence>

        {/* Mini-map */}
        {graphNodeCount > 0 && (
          <div
            className="absolute bottom-3 right-3 rounded-md border border-border bg-[rgba(13,14,16,0.75)] backdrop-blur-md overflow-hidden pointer-events-none"
            style={{ width: MINIMAP_W, height: MINIMAP_H }}
          >
            <svg ref={minimapRef} width={MINIMAP_W} height={MINIMAP_H} viewBox={`0 0 ${dims.w} ${dims.h}`}>
              <rect width={dims.w} height={dims.h} fill="rgba(0,0,0,0.4)" />
              {/* Viewport indicator */}
              <rect
                x={minimapViewBox.visibleX}
                y={minimapViewBox.visibleY}
                width={minimapViewBox.visibleW}
                height={minimapViewBox.visibleH}
                fill="rgba(0,255,163,0.08)"
                stroke="rgba(0,255,163,0.55)"
                strokeWidth={2 / (minimapViewBox.visibleW / MINIMAP_W)}
              />
            </svg>
          </div>
        )}

        {/* Empty state */}
        {graphNodeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-[.8rem]">
            No items to map.
          </div>
        )}

        {/* Legend — per-source key derived from items in view */}
        {presentSources.length > 0 && (
          <div className="absolute top-3 left-3 rounded-md border border-border bg-[rgba(13,14,16,0.75)] backdrop-blur-md px-2.5 py-2 text-[.6rem] text-txt-2 pointer-events-none max-w-[220px]">
            <div className="text-[.55rem] uppercase tracking-widest text-muted mb-1.5 font-headline">Sources</div>
            {presentSources.map(name => {
              const brand = getSourceBrand(name);
              return (
                <div key={name} className="flex items-center gap-1.5 mb-1 last:mb-0">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[.55rem] shrink-0 overflow-hidden"
                    style={{ background: brand.accent, opacity: 0.9 }}
                  >
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      brand.glyph
                    )}
                  </span>
                  <span className="truncate">{name}</span>
                </div>
              );
            })}
            <div className="mt-1.5 pt-1.5 border-t border-border flex items-center gap-3 text-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#00ffa3', opacity: 0.6 }} />
                ticker
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#bf81ff', opacity: 0.6 }} />
                tag
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="px-3 py-1.5 border-t border-border text-[.6rem] text-muted flex items-center gap-3 flex-wrap">
        <span>Click bubble → open</span>
        <span>·</span>
        <span>Drag bubble → reposition</span>
        <span>·</span>
        <span>Double-click → release</span>
        <span>·</span>
        <span>Scroll / pinch → zoom</span>
      </div>

      {/* Preview modal */}
      {selected && (
        <NewsPreviewModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
