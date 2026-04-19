import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Link-preview hover card with subtle 3D flip-in animation and an
 * optional magnifying-lens effect over the preview surface.
 *
 * Built without Radix — we use our own portal + Framer Motion so the
 * component stays under 5KB and doesn't drag in another dependency
 * tree the ESM bundler would have to rebundle. Inspired by Aceternity
 * UI's HoverPeek but retuned for the Veridian Night palette and
 * our render-prop model (so callers can inject custom React content
 * instead of being locked into a screenshot URL).
 *
 * Props:
 *   children       — the hover trigger (wrapped in a span if not a valid element)
 *   content        — JSX rendered inside the preview card (required)
 *   width/height   — card dimensions; defaults 280 × 160
 *   openDelay      — ms before showing (default 120)
 *   closeDelay     — ms before hiding (default 180)
 *   side           — 'top' | 'bottom', default 'top'
 *   align          — 'start' | 'center' | 'end', default 'center'
 *   offset         — pixel gap between trigger and card (default 10)
 *   enableLens     — show a magnifying lens on hover (default false)
 *   lensSize       — diameter of the lens in pixels (default 100)
 *   lensZoom       — zoom factor inside the lens (default 1.6)
 *   className      — passthrough for trigger wrapper class
 */
export default function HoverPeek({
  children,
  content,
  width = 280,
  height = 160,
  openDelay = 120,
  closeDelay = 180,
  side = 'top',
  align = 'center',
  offset = 10,
  enableLens = false,
  lensSize = 100,
  lensZoom = 1.6,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, active: false });
  const triggerRef = useRef(null);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const startX = r.left;
    const endX = r.right;
    const x = align === 'start' ? startX
            : align === 'end'   ? endX - width
            : centerX - width / 2;
    const y = side === 'bottom'
      ? r.bottom + offset
      : r.top - height - offset;
    setCoords({ x, y });
  }, [align, offset, side, width, height]);

  const scheduleOpen = () => {
    clearTimeout(closeTimer.current);
    if (open) return;
    openTimer.current = setTimeout(() => {
      computePosition();
      setOpen(true);
    }, openDelay);
  };

  const scheduleClose = () => {
    clearTimeout(openTimer.current);
    if (!open) return;
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  useEffect(() => {
    if (!open) return;
    const update = () => computePosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, computePosition]);

  useEffect(() => () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  // Trigger element gets event handlers + ref threaded through.
  const triggerProps = {
    ref: triggerRef,
    onMouseEnter: scheduleOpen,
    onMouseLeave: scheduleClose,
    onFocus: scheduleOpen,
    onBlur: scheduleClose,
    className,
  };

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        ...triggerProps,
        className: [children.props?.className, className].filter(Boolean).join(' '),
        ref: (node) => {
          triggerRef.current = node;
          const childRef = children.ref;
          if (typeof childRef === 'function') childRef(node);
          else if (childRef && typeof childRef === 'object') childRef.current = node;
        },
      })
    : <span {...triggerProps}>{children}</span>;

  // Lens handlers — only attach when enableLens
  const lensProps = enableLens ? {
    onMouseMove: (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setLensPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
    },
    onMouseLeave: () => setLensPos(p => ({ ...p, active: false })),
  } : {};

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: side === 'top' ? 6 : -6, rotateX: side === 'top' ? -8 : 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: side === 'top' ? 4 : -4, rotateX: side === 'top' ? -6 : 6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              style={{
                position: 'fixed',
                top: coords.y,
                left: coords.x,
                width,
                pointerEvents: 'auto',
                zIndex: 80,
                transformPerspective: 1000,
              }}
              onMouseEnter={() => clearTimeout(closeTimer.current)}
              onMouseLeave={scheduleClose}
            >
              <div
                className="relative rounded-xl overflow-hidden backdrop-blur-xl border border-border shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
                style={{ background: 'rgba(13,14,16,0.92)', width, minHeight: height }}
                {...lensProps}
              >
                {content}
                <AnimatePresence>
                  {enableLens && lensPos.active && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute inset-0 pointer-events-none overflow-hidden"
                      style={{
                        maskImage: `radial-gradient(circle ${lensSize / 2}px at ${lensPos.x}px ${lensPos.y}px, black ${lensSize / 2}px, transparent ${lensSize / 2}px)`,
                        WebkitMaskImage: `radial-gradient(circle ${lensSize / 2}px at ${lensPos.x}px ${lensPos.y}px, black ${lensSize / 2}px, transparent ${lensSize / 2}px)`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `scale(${lensZoom})`,
                          transformOrigin: `${lensPos.x}px ${lensPos.y}px`,
                        }}
                      >
                        {content}
                      </div>
                      <div
                        className="absolute rounded-full border border-sea/40 pointer-events-none"
                        style={{
                          width: lensSize,
                          height: lensSize,
                          top: lensPos.y - lensSize / 2,
                          left: lensPos.x - lensSize / 2,
                          boxShadow: '0 0 24px rgba(0,255,163,0.35) inset',
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
