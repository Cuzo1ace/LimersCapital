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
import NewsPreviewModal from './NewsPreviewModal';

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
  const [dims, setDims] = useState({ w: WIDTH_DEFAULT, h: HEIGHT_DEFAULT });
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [hoverId, setHoverId] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, k: 1 });

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

    // Edges
    const linkSel = world.append('g').attr('class', 'links').selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.10)')
      .attr('stroke-width', d => 0.5 + d.strength * 1.8);

    // Nodes
    const nodeG = world.append('g').attr('class', 'nodes').selectAll('g')
      .data(nodeData, d => d.id)
      .join('g')
      .attr('class', d => `bubble bubble-${d.kind}`)
      .style('cursor', 'pointer');

    nodeG.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => nodeFill(d))
      .attr('fill-opacity', d => d.kind === 'item' ? 0.85 : 0.55)
      .attr('stroke', d => nodeStroke(d))
      .attr('stroke-width', 1.5);

    // Labels — only tickers and tags show labels by default; items show on hover
    nodeG.filter(d => d.kind !== 'item').append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#0d0e10')
      .attr('font-size', d => d.kind === 'ticker' ? 11 : 9)
      .attr('font-weight', 700)
      .attr('font-family', 'DM Mono, monospace')
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

    // Simulation tick: update positions
    sim.on('tick', () => {
      linkSel
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);
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

  function handleNodeClick(d) {
    // d3 event listeners run outside React's auto-batched event system in
    // some React 18 code paths; queueMicrotask defers the setState to a
    // point where React reliably schedules a re-render.
    queueMicrotask(() => {
      if (d.kind === 'item') {
        setSelected(d.item);
        return;
      }
      if (d.kind === 'ticker') {
        onFilterChipChange?.('solana');
        onSwitchToGrid?.();
        return;
      }
      if (d.kind === 'tag') {
        const tag = d.tag;
        const chip =
          tag === 'solana' ? 'solana'
          : tag === 'ttse' ? 'ttse'
          : tag === 'caribbean' ? 'caribbean'
          : tag === 'education' || tag === 'learn' ? 'learn'
          : 'all';
        onFilterChipChange?.(chip);
        onSwitchToGrid?.();
      }
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

        {/* Legend */}
        <div className="absolute top-3 left-3 rounded-md border border-border bg-[rgba(13,14,16,0.75)] backdrop-blur-md px-2.5 py-2 text-[.6rem] text-txt-2 pointer-events-none">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ background: '#00ffa3', opacity: 0.85 }} />
            <span>News item</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ background: '#00ffa3', opacity: 0.55 }} />
            <span>Ticker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: '#bf81ff', opacity: 0.55 }} />
            <span>Tag</span>
          </div>
        </div>
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
