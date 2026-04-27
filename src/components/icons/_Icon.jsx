import { forwardRef, useId } from 'react';

/**
 * Shared SVG wrapper that normalizes the icon contract across the branded set.
 * Every icon in `src/components/icons/*` renders its paths through this wrapper.
 *
 * Contract (frozen — do not change without a codemod):
 *   - size         number | string   default 24           sets both width + height
 *   - color        string            default 'currentColor'   lets Tailwind `text-sea` drive
 *   - strokeWidth  number            default 1.75         Emil/Lucide aesthetic
 *   - title        string            a11y accessible name; if omitted, aria-hidden="true"
 *   - className    string            forwarded to root <svg>
 *   - viewBox      string            default '0 0 24 24'  overridable by brand motifs
 *   - children     SVG path shapes
 */
const Icon = forwardRef(function Icon(
  {
    size = 24,
    color = 'currentColor',
    strokeWidth = 1.75,
    title,
    className,
    viewBox = '0 0 24 24',
    children,
    // Swallow icon-specific props so they never leak to the <svg> DOM element.
    // StarIcon uses `filled` internally but also forwards ...props — this stops
    // React's "non-boolean attribute" warning when TierMark passes filled through
    // to icons that don't consume it.
    filled: _filled,
    ...rest
  },
  ref,
) {
  const titleId = useId();
  const labelled = typeof title === 'string' && title.length > 0;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-labelledby={labelled ? titleId : undefined}
      focusable="false"
      {...rest}
    >
      {labelled ? <title id={titleId}>{title}</title> : null}
      {children}
    </svg>
  );
});

export default Icon;
