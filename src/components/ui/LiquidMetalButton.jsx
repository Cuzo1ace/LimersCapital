import { useEffect, useMemo, useRef, useState } from 'react';
import { liquidMetalFragmentShader, ShaderMount } from '@paper-design/shaders';

/**
 * LiquidMetalButton — WebGL shader button with liquid metal surface,
 * 3D perspective layers, press ripple, and hover speed boost.
 *
 * Props:
 *   label     — button text
 *   onClick   — click handler
 *   icon      — optional emoji/text icon (replaces label when set alone)
 *   className — extra classes on outer wrapper
 *   width     — custom width (px), default auto-sized
 *   height    — custom height (px), default 46
 *   disabled  — disables interaction
 */
export default function LiquidMetalButton({
  label = 'Get Started',
  onClick,
  icon,
  className = '',
  width,
  height = 46,
  disabled = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const shaderRef = useRef(null);
  const shaderMount = useRef(null);
  const buttonRef = useRef(null);
  const rippleId = useRef(0);

  const dims = useMemo(() => {
    const w = width || (icon && !label ? 46 : 160);
    return {
      width: w,
      height,
      innerWidth: w - 4,
      innerHeight: height - 4,
    };
  }, [width, height, icon, label]);

  /* ── Inject global styles once ── */
  useEffect(() => {
    const id = 'liquid-metal-btn-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .lm-shader canvas {
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        border-radius: 100px !important;
      }
      @keyframes lm-ripple {
        0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.6; }
        100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* ── Init WebGL shader ── */
  useEffect(() => {
    if (!shaderRef.current) return;

    if (shaderMount.current?.destroy) shaderMount.current.destroy();

    try {
      shaderMount.current = new ShaderMount(
        shaderRef.current,
        liquidMetalFragmentShader,
        {
          u_repetition: 4,
          u_softness: 0.5,
          u_shiftRed: 0.3,
          u_shiftBlue: 0.3,
          u_distortion: 0,
          u_contour: 0,
          u_angle: 45,
          u_scale: 8,
          u_shape: 1,
          u_offsetX: 0.1,
          u_offsetY: -0.1,
        },
        undefined,
        0.6,
      );
    } catch (err) {
      console.warn('[LiquidMetalButton] shader init failed:', err);
    }

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(0.6);
  };

  const handleClick = (e) => {
    if (disabled) return;

    /* Speed burst on click */
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        shaderMount.current?.setSpeed?.(isHovered ? 1 : 0.6);
      }, 300);
    }

    /* Ripple */
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const r = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
      setRipples(prev => [...prev, r]);
      setTimeout(() => setRipples(prev => prev.filter(p => p.id !== r.id)), 600);
    }

    onClick?.();
  };

  const baseTransition = 'all 0.8s cubic-bezier(0.34,1.56,0.64,1), width 0.4s ease, height 0.4s ease';
  const pressTransform = isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)';

  return (
    <div className={`relative inline-block ${className}`}>
      <div style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}>
        <div
          style={{
            position: 'relative',
            width: dims.width,
            height: dims.height,
            transformStyle: 'preserve-3d',
            transition: baseTransition,
          }}
        >
          {/* Layer 4 — Label (top) */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(20px)',
              zIndex: 30,
              pointerEvents: 'none',
              transition: baseTransition,
            }}
          >
            {icon && (
              <span style={{
                fontSize: 16,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                color: '#aaa',
              }}>
                {icon}
              </span>
            )}
            {label && (
              <span style={{
                fontSize: 14,
                color: '#999',
                fontWeight: 500,
                fontFamily: 'var(--font-headline)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            )}
          </div>

          {/* Layer 3 — Dark inner pill */}
          <div
            style={{
              position: 'absolute', inset: 0,
              transformStyle: 'preserve-3d',
              transform: `translateZ(10px) ${pressTransform}`,
              zIndex: 20,
              transition: baseTransition + ', box-shadow 0.15s ease',
            }}
          >
            <div style={{
              width: dims.innerWidth,
              height: dims.innerHeight,
              margin: 2,
              borderRadius: 100,
              background: 'linear-gradient(180deg, #1a1c1e 0%, #000 100%)',
              boxShadow: isPressed
                ? 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0,0,0,0.3)'
                : 'none',
              transition: 'box-shadow 0.15s ease',
            }} />
          </div>

          {/* Layer 2 — Shader surface */}
          <div
            style={{
              position: 'absolute', inset: 0,
              transformStyle: 'preserve-3d',
              transform: `translateZ(0) ${pressTransform}`,
              zIndex: 10,
              transition: baseTransition + ', box-shadow 0.15s ease',
            }}
          >
            <div style={{
              width: dims.width,
              height: dims.height,
              borderRadius: 100,
              boxShadow: isPressed
                ? '0 0 0 1px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)'
                : isHovered
                  ? '0 0 0 1px rgba(0,0,0,0.4), 0 12px 6px rgba(0,0,0,0.05), 0 8px 5px rgba(0,0,0,0.1), 0 4px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.2)'
                  : '0 0 0 1px rgba(0,0,0,0.3), 0 36px 14px rgba(0,0,0,0.02), 0 20px 12px rgba(0,0,0,0.08), 0 9px 9px rgba(0,0,0,0.12), 0 2px 5px rgba(0,0,0,0.15)',
              transition: 'box-shadow 0.15s ease',
            }}>
              <div
                ref={shaderRef}
                className="lm-shader"
                style={{
                  borderRadius: 100,
                  overflow: 'hidden',
                  position: 'relative',
                  width: dims.width,
                  maxWidth: dims.width,
                  height: dims.height,
                }}
              />
            </div>
          </div>

          {/* Layer 1 — Invisible click target */}
          <button
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => !disabled && setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            disabled={disabled}
            style={{
              position: 'absolute', inset: 0,
              width: dims.width,
              height: dims.height,
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              outline: 'none',
              zIndex: 40,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(25px)',
              overflow: 'hidden',
              borderRadius: 100,
              opacity: disabled ? 0.5 : 1,
            }}
            aria-label={label || 'button'}
          >
            {ripples.map(r => (
              <span
                key={r.id}
                style={{
                  position: 'absolute',
                  left: r.x,
                  top: r.y,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none',
                  animation: 'lm-ripple 0.6s ease-out',
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
