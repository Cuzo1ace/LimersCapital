// Veridian Night — matches src/index.css + design/tokens.json
export const COLORS = {
  night: '#0d0e10',
  night2: '#121316',
  night3: '#1e2022',
  sea: '#00ffa3',
  seaDk: '#00ef99',
  coral: '#bf81ff',
  sun: '#FFCA3A',
  palm: '#2D9B56',
  up: '#00ffa3',
  down: '#ff716c',
  txt: '#fdfbfe',
  txt2: '#ababad',
  muted: '#ababad',
  border: 'rgba(71,72,74,0.4)',
  card: 'rgba(18,19,22,0.85)',
} as const;

export const FONTS = {
  headline: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'DM Mono', 'Courier New', monospace",
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xl2: 24,
  full: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xl2: 32,
} as const;
