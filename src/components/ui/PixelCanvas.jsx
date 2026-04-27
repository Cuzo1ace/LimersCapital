import { useEffect, useRef } from 'react';

/**
 * Pixel — one tile in the grid; handles its own appear/disappear/shimmer.
 */
class Pixel {
  constructor(canvas, context, x, y, color, speed, delay) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) this.shimmer();
    else this.size += this.sizeStep;
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    }
    this.size -= 0.1;
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true;
    else if (this.size <= this.minSize) this.isReverse = false;
    if (this.isReverse) this.size -= this.speed;
    else this.size += this.speed;
  }
}

/**
 * <pixel-canvas> custom element — wraps a canvas inside its shadow DOM and
 * animates a pixel field on parent mouseenter/leave (or focus/blur).
 */
class PixelCanvasElement extends HTMLElement {
  constructor() {
    super();
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.pixels = [];
    this.animation = null;
    this.timeInterval = 1000 / 60;
    this.timePrevious = performance.now();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._initialized = false;
    this._resizeObserver = null;
    this._parent = null;
    this._listeners = null;

    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host { display: grid; inline-size: 100%; block-size: 100%; overflow: hidden; }
    `;
    shadow.appendChild(style);
    shadow.appendChild(this.canvas);
  }

  get colors() {
    return this.dataset.colors?.split(',') || ['#f8fafc', '#f1f5f9', '#cbd5e1'];
  }
  get gap() {
    const value = Number(this.dataset.gap) || 5;
    return Math.max(4, Math.min(50, value));
  }
  get speed() {
    const value = Number(this.dataset.speed) || 35;
    return this.reducedMotion ? 0 : Math.max(0, Math.min(100, value)) * 0.001;
  }
  get noFocus() {
    return this.hasAttribute('data-no-focus');
  }
  get variant() {
    return this.dataset.variant || 'default';
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;
    this._parent = this.parentElement;

    requestAnimationFrame(() => {
      this.handleResize();
      const ro = new ResizeObserver((entries) => {
        if (!entries.length) return;
        requestAnimationFrame(() => this.handleResize());
      });
      ro.observe(this);
      this._resizeObserver = ro;
    });

    // Stable references so we can remove them on disconnect
    const onEnter = () => this.handleAnimation('appear');
    const onLeave = () => this.handleAnimation('disappear');
    this._listeners = { onEnter, onLeave };

    this._parent?.addEventListener('mouseenter', onEnter);
    this._parent?.addEventListener('mouseleave', onLeave);
    if (!this.noFocus) {
      this._parent?.addEventListener('focus', onEnter, { capture: true });
      this._parent?.addEventListener('blur', onLeave, { capture: true });
    }
  }

  disconnectedCallback() {
    this._initialized = false;
    this._resizeObserver?.disconnect();

    if (this._listeners && this._parent) {
      this._parent.removeEventListener('mouseenter', this._listeners.onEnter);
      this._parent.removeEventListener('mouseleave', this._listeners.onLeave);
      if (!this.noFocus) {
        this._parent.removeEventListener('focus', this._listeners.onEnter, { capture: true });
        this._parent.removeEventListener('blur', this._listeners.onLeave, { capture: true });
      }
    }
    this._listeners = null;

    if (this.animation) {
      cancelAnimationFrame(this.animation);
      this.animation = null;
    }
    this._parent = null;
  }

  handleResize() {
    if (!this.ctx || !this._initialized) return;
    const rect = this.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.createPixels();
  }

  getDistanceToCenter(x, y) {
    const dx = x - this.canvas.width / 2;
    const dy = y - this.canvas.height / 2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDistanceToBottomLeft(x, y) {
    const dx = x;
    const dy = this.canvas.height - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  createPixels() {
    if (!this.ctx) return;
    this.pixels = [];
    for (let x = 0; x < this.canvas.width; x += this.gap) {
      for (let y = 0; y < this.canvas.height; y += this.gap) {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        let delay = 0;
        if (this.variant === 'icon') {
          delay = this.reducedMotion ? 0 : this.getDistanceToCenter(x, y);
        } else {
          delay = this.reducedMotion ? 0 : this.getDistanceToBottomLeft(x, y);
        }
        this.pixels.push(new Pixel(this.canvas, this.ctx, x, y, color, this.speed, delay));
      }
    }
  }

  handleAnimation(name) {
    if (this.animation) cancelAnimationFrame(this.animation);
    const animate = () => {
      this.animation = requestAnimationFrame(animate);
      const timeNow = performance.now();
      const timePassed = timeNow - this.timePrevious;
      if (timePassed < this.timeInterval) return;
      this.timePrevious = timeNow - (timePassed % this.timeInterval);
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let allIdle = true;
      for (const pixel of this.pixels) {
        pixel[name]();
        if (!pixel.isIdle) allIdle = false;
      }
      if (allIdle) {
        cancelAnimationFrame(this.animation);
        this.animation = null;
      }
    };
    animate();
  }
}

let elementRegistered = false;
function registerElement() {
  if (elementRegistered || typeof window === 'undefined') return;
  if (!customElements.get('pixel-canvas')) {
    customElements.define('pixel-canvas', PixelCanvasElement);
  }
  elementRegistered = true;
}

/**
 * PixelCanvas — React wrapper.
 *
 * Default behaviour mirrors the upstream component (animates on parent
 * mouseenter / mouseleave). Pass `active` to drive the animation
 * imperatively without relying on hover — useful when the canvas is an
 * overlay on a moving target (e.g. a selected bubble in the news map).
 *
 * Props:
 *   gap       — pixel grid spacing, 4–50 (default 5)
 *   speed     — animation speed, 0–100 (default 35)
 *   colors    — array of hex colours (default light slates)
 *   variant   — 'default' (radiate from bottom-left) | 'icon' (radiate from centre)
 *   noFocus   — disable focus/blur triggers
 *   active    — when defined, drives appear (true) / disappear (false)
 *               via direct `mouseenter` / `mouseleave` dispatch on the
 *               wrapper. Leave undefined for default hover behaviour.
 *   className — appended to the wrapping span
 *   style     — inline styles on the wrapping span
 */
export default function PixelCanvas({
  gap,
  speed,
  colors,
  variant,
  noFocus,
  active,
  className = '',
  style,
  ...rest
}) {
  const wrapperRef = useRef(null);

  useEffect(() => { registerElement(); }, []);

  // Drive the animation imperatively when `active` is controlled.
  useEffect(() => {
    if (active === undefined) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const canvasEl = wrapper.querySelector('pixel-canvas');
    // The web component's auto-resize via rAF/ResizeObserver can miss the
    // initial mount when the wrapper is freshly inserted. Poke it once so
    // the internal canvas sizes to the wrapper before we trigger 'appear'.
    if (active && canvasEl?.handleResize) {
      canvasEl.handleResize();
    }
    // The web component listens for these on its parent — dispatch them
    // directly so we don't need a real cursor over the wrapper.
    const evt = new Event(active ? 'mouseenter' : 'mouseleave');
    wrapper.dispatchEvent(evt);
  }, [active]);

  return (
    <span
      ref={wrapperRef}
      className={className}
      style={style}
      {...rest}
    >
      <pixel-canvas
        data-gap={gap}
        data-speed={speed}
        data-colors={colors?.join(',')}
        data-variant={variant}
        {...(noFocus ? { 'data-no-focus': '' } : {})}
      />
    </span>
  );
}

export { PixelCanvas };
