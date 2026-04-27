import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import * as Icons from './index';

const ICON_NAMES = Object.keys(Icons).filter((k) => k !== 'Icon');

const html = (node) => renderToStaticMarkup(node);
const attr = (markup, name) => {
  const m = markup.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};

describe('branded icon set — contract', () => {
  it('exports exactly 25 concrete icons', () => {
    expect(ICON_NAMES).toHaveLength(25);
  });

  it.each(ICON_NAMES)('%s renders an <svg> root at default 24x24', (name) => {
    const Cmp = Icons[name];
    const out = html(<Cmp />);
    expect(out.startsWith('<svg')).toBe(true);
    expect(attr(out, 'width')).toBe('24');
    expect(attr(out, 'height')).toBe('24');
  });

  it.each(ICON_NAMES)('%s accepts size + color overrides', (name) => {
    const Cmp = Icons[name];
    const out = html(<Cmp size={48} color="red" />);
    expect(attr(out, 'width')).toBe('48');
    expect(attr(out, 'height')).toBe('48');
    expect(attr(out, 'stroke')).toBe('red');
  });

  it.each(ICON_NAMES)('%s is aria-hidden by default', (name) => {
    const Cmp = Icons[name];
    const out = html(<Cmp />);
    expect(attr(out, 'aria-hidden')).toBe('true');
    expect(attr(out, 'role')).toBeNull();
  });

  it.each(ICON_NAMES)(
    '%s becomes role="img" with accessible name when title is given',
    (name) => {
      const Cmp = Icons[name];
      const label = `${name}-label`;
      const out = html(<Cmp title={label} />);
      expect(attr(out, 'role')).toBe('img');
      expect(attr(out, 'aria-hidden')).toBeNull();
      expect(attr(out, 'aria-labelledby')).toBeTruthy();
      expect(out).toContain(`>${label}</title>`);
    },
  );

  it.each(ICON_NAMES)('%s forwards className to svg root', (name) => {
    const Cmp = Icons[name];
    const out = html(<Cmp className="text-sea" />);
    expect(attr(out, 'class')).toBe('text-sea');
  });

  it.each(ICON_NAMES)(
    '%s defaults stroke to currentColor so Tailwind classes drive',
    (name) => {
      const Cmp = Icons[name];
      const out = html(<Cmp />);
      expect(attr(out, 'stroke')).toBe('currentColor');
    },
  );
});
