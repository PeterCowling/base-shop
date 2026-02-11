import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('PWA static asset contracts', () => {
  const publicDir = path.resolve(__dirname, '../../../../public');

  it('TC-02: manifest is present and wired for root app shell discovery', () => {
    const manifestPath = path.join(publicDir, 'manifest.webmanifest');
    const raw = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw) as {
      start_url?: string;
      scope?: string;
      display?: string;
      icons?: Array<{ src?: string }>;
    };

    expect(manifest.start_url).toBe('/portal');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons?.[0]?.src).toBe('/icons/prime-icon.svg');
  });

  it('TC-03: service worker includes deterministic cache-version invalidation logic', () => {
    const swPath = path.join(publicDir, 'sw.js');
    const source = readFileSync(swPath, 'utf8');

    expect(source).toContain("const CACHE_VERSION = 'v1'");
    expect(source).toContain("const CACHE_NAME = `prime-arrival-shell-${CACHE_VERSION}`");
    expect(source).toContain("key.startsWith('prime-arrival-shell-') && key !== CACHE_NAME");
    expect(source).toContain('caches.delete(key)');
  });
});
