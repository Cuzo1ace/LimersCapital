/**
 * PWA Configuration Tests
 * Validates manifest, caching strategy, and icon configuration.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '../../');

describe('PWA — Manifest', () => {
  it('vite.config.js imports VitePWA', () => {
    const config = readFileSync(resolve(ROOT, 'vite.config.js'), 'utf8');
    expect(config).toContain("import { VitePWA } from 'vite-plugin-pwa'");
    expect(config).toContain('VitePWA(');
  });

  it('manifest has required fields', () => {
    const config = readFileSync(resolve(ROOT, 'vite.config.js'), 'utf8');
    expect(config).toContain("name: \"Limer's Capital\"");
    expect(config).toContain("short_name: 'Limers'");
    expect(config).toContain("display: 'standalone'");
    expect(config).toContain("theme_color: '#0d0e10'");
    expect(config).toContain("start_url: '/'");
  });

  it('manifest includes all required icon sizes', () => {
    const config = readFileSync(resolve(ROOT, 'vite.config.js'), 'utf8');
    expect(config).toContain('pwa-64x64.png');
    expect(config).toContain('pwa-192x192.png');
    expect(config).toContain('pwa-512x512.png');
    expect(config).toContain('maskable-icon-512x512.png');
  });

  it('manifest has maskable icon for Android adaptive icons', () => {
    const config = readFileSync(resolve(ROOT, 'vite.config.js'), 'utf8');
    expect(config).toContain("purpose: 'maskable'");
  });
});

describe('PWA — Icons', () => {
  const icons = [
    'public/favicon.svg',
    'public/icon.svg',
    'public/apple-touch-icon.svg',
    'public/maskable-icon.svg',
    'public/pwa-64x64.png',
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
    'public/maskable-icon-512x512.png',
    'public/apple-touch-icon-180x180.png',
  ];

  icons.forEach((iconPath) => {
    it(`${iconPath} exists`, () => {
      expect(existsSync(resolve(ROOT, iconPath))).toBe(true);
    });
  });
});

describe('PWA — Service Worker Caching', () => {
  const config = readFileSync(resolve(ROOT, 'vite.config.js'), 'utf8');

  it('caches Pyth price feeds (stale-while-revalidate)', () => {
    expect(config).toContain('pyth-prices');
    expect(config).toMatch(/hermes.*pyth.*network/);
  });

  it('caches DexScreener data', () => {
    expect(config).toContain('dexscreener-prices');
    expect(config).toMatch(/api.*dexscreener.*com/);
  });

  it('caches CoinGecko data', () => {
    expect(config).toContain('coingecko-data');
  });

  it('caches API proxy with network-first strategy', () => {
    expect(config).toContain('limer-api-proxy');
    expect(config).toContain("handler: 'NetworkFirst'");
  });

  it('caches Supabase with network-first and timeout', () => {
    expect(config).toContain('supabase-data');
    expect(config).toContain('networkTimeoutSeconds: 3');
  });

  it('caches crypto images with cache-first (long TTL)', () => {
    expect(config).toContain('crypto-images');
    expect(config).toContain("handler: 'CacheFirst'");
  });

  it('caches Google Fonts with long TTL', () => {
    expect(config).toContain('google-fonts-stylesheets');
    expect(config).toContain('google-fonts-webfonts');
  });

  it('caches TTSE proxy data', () => {
    expect(config).toContain('ttse-data');
  });

  it('caches DeFi Llama data', () => {
    expect(config).toContain('defillama-data');
  });

  it('caches World Bank data with cache-first', () => {
    expect(config).toContain('worldbank-data');
  });
});

describe('PWA — HTML Meta Tags', () => {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');

  it('has theme-color meta tag', () => {
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('content="#0d0e10"');
  });

  it('has apple-mobile-web-app-capable', () => {
    expect(html).toContain('name="apple-mobile-web-app-capable"');
  });

  it('has apple-touch-icon link', () => {
    expect(html).toContain('rel="apple-touch-icon"');
  });

  it('has viewport-fit=cover for notched devices', () => {
    expect(html).toContain('viewport-fit=cover');
  });

  it('has description meta tag', () => {
    expect(html).toContain('name="description"');
  });

  it('has favicon SVG link', () => {
    expect(html).toContain('href="/favicon.svg"');
  });
});

describe('PWA — Components', () => {
  it('InstallPrompt component exists', () => {
    expect(existsSync(resolve(ROOT, 'src/components/pwa/InstallPrompt.jsx'))).toBe(true);
  });

  it('UpdatePrompt component exists', () => {
    expect(existsSync(resolve(ROOT, 'src/components/pwa/UpdatePrompt.jsx'))).toBe(true);
  });

  it('OfflineIndicator component exists', () => {
    expect(existsSync(resolve(ROOT, 'src/components/pwa/OfflineIndicator.jsx'))).toBe(true);
  });

  it('App.jsx imports PWA components', () => {
    const app = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8');
    expect(app).toContain('InstallPrompt');
    expect(app).toContain('UpdatePrompt');
    expect(app).toContain('OfflineIndicator');
  });
});
