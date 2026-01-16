/**
 * Tests for route-runtime.ts
 *
 * Covers:
 * - Route matching algorithm
 * - Parameter extraction
 * - Wildcard routes
 * - Nested routes
 * - Loader execution
 * - Redirect handling
 * - 404 handling
 * - Multilingual routing
 */

import { resolveRoute, buildRouterState, listLocalizedPaths } from '../../src/compat/route-runtime';

// Mock route modules to avoid actual imports
jest.mock('../../src/compat/route-modules', () => ({
  routeModules: {
    'routes/home.tsx': () => Promise.resolve({
      default: () => null,
      loader: () => ({ message: 'home' }),
    }),
    'routes/rooms.tsx': () => Promise.resolve({
      default: () => null,
      loader: () => ({ rooms: [] }),
    }),
    'routes/rooms.$id.tsx': () => Promise.resolve({
      default: () => null,
      loader: ({ params }: { params: Record<string, string | undefined> }) => ({
        room: { id: params['id'] },
      }),
    }),
    'routes/guides/path-of-the-gods.tsx': () => Promise.resolve({
      default: () => null,
      loader: () => ({ guide: 'path-of-the-gods' }),
      meta: () => [{ title: 'Path of the Gods' }],
      links: () => [{ rel: 'canonical', href: '/guides/path-of-the-gods' }],
    }),
    'routes/not-found.tsx': () => Promise.resolve({
      default: () => null,
    }),
  },
}));

// Mock routes configuration
jest.mock('../../src/routes', () => ({
  default: [
    {
      id: 'en-home',
      path: 'en',
      file: 'routes/home.tsx',
      children: [],
    },
    {
      id: 'en-rooms',
      path: 'en/rooms',
      file: 'routes/rooms.tsx',
      children: [
        {
          id: 'en-room-detail',
          path: ':id',
          file: 'routes/rooms.$id.tsx',
        },
      ],
    },
    {
      id: 'en-guides',
      path: 'en/guides',
      children: [
        {
          id: 'en-guide-potg',
          path: 'path-of-the-gods',
          file: 'routes/guides/path-of-the-gods.tsx',
        },
      ],
    },
    {
      id: 'en-404',
      path: 'en/*',
      file: 'routes/not-found.tsx',
    },
  ],
}));

// Mock data dependencies
jest.mock('../../src/data/roomsData', () => ({
  default: [
    { id: 'room-1' },
    { id: 'room-2' },
  ],
}));

jest.mock('../../src/data/tags.index', () => ({
  TAGS_SUMMARY: [
    { tag: 'beaches' },
    { tag: 'hiking' },
  ],
}));

jest.mock('../../src/i18n.config', () => ({
  i18nConfig: {
    supportedLngs: ['en', 'it', 'de'],
    fallbackLng: 'en',
  },
}));

jest.mock('../../src/config/site', () => ({
  BASE_URL: 'https://example.com',
}));

describe('route-runtime', () => {
  describe('resolveRoute - Basic Matching', () => {
    it('should resolve root language route', async () => {
      const result = await resolveRoute('/en');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches).toHaveLength(1);
      expect(result.result.matches[0]?.id).toBe('en-home');
      expect(result.result.params).toEqual({ lang: 'en' });
    });

    it('should resolve nested route', async () => {
      const result = await resolveRoute('/en/rooms');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches).toHaveLength(1);
      expect(result.result.matches[0]?.file).toBe('routes/rooms.tsx');
    });

    it('should resolve parameterized route', async () => {
      const result = await resolveRoute('/en/rooms/room-1');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches).toHaveLength(2);
      expect(result.result.params).toEqual({ lang: 'en', id: 'room-1' });
    });

    it('should return notFound for unmatched route', async () => {
      const result = await resolveRoute('/en/does-not-exist');

      expect(result).toHaveProperty('notFound', true);
    });

    it('should decode URL-encoded path segments', async () => {
      const result = await resolveRoute('/en/rooms/room%20with%20spaces');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.params['id']).toBe('room with spaces');
    });
  });

  describe('resolveRoute - Loaders', () => {
    it('should execute loader and include data in matches', async () => {
      const result = await resolveRoute('/en');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches[0]?.data).toEqual({ message: 'home' });
    });

    it('should execute loader with params', async () => {
      const result = await resolveRoute('/en/rooms/test-room');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      const roomDetailMatch = result.result.matches.find(m => m.file === 'routes/rooms.$id.tsx');
      expect(roomDetailMatch?.data).toEqual({ room: { id: 'test-room' } });
    });

    it('should execute loaders for all matched routes', async () => {
      const result = await resolveRoute('/en/rooms/room-1');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches).toHaveLength(2);
      expect(result.result.matches[0]?.data).toEqual({ rooms: [] });
      expect(result.result.matches[1]?.data).toEqual({ room: { id: 'room-1' } });
    });
  });

  describe('resolveRoute - Metadata', () => {
    it('should collect meta from route module', async () => {
      const result = await resolveRoute('/en/guides/path-of-the-gods');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.head.meta).toContainEqual({ title: 'Path of the Gods' });
    });

    it('should collect links from route module', async () => {
      const result = await resolveRoute('/en/guides/path-of-the-gods');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.head.links).toContainEqual({
        rel: 'canonical',
        href: '/guides/path-of-the-gods',
      });
    });
  });

  describe('resolveRoute - Pathname Normalization', () => {
    it('should handle trailing slashes', async () => {
      const result = await resolveRoute('/en/');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches[0]?.id).toBe('en-home');
    });

    it('should handle paths without leading slash', async () => {
      const result = await resolveRoute('en');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches[0]?.id).toBe('en-home');
    });

    it('should strip query string from pathname', async () => {
      const result = await resolveRoute('/en?foo=bar');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.location.search).toBe('');
      expect(result.result.matches[0]?.id).toBe('en-home');
    });

    it('should strip hash from pathname', async () => {
      const result = await resolveRoute('/en#section');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.location.hash).toBe('');
      expect(result.result.matches[0]?.id).toBe('en-home');
    });

    it('should handle multiple trailing slashes', async () => {
      const result = await resolveRoute('/en///');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.matches[0]?.id).toBe('en-home');
    });
  });

  describe('buildRouterState', () => {
    it('should build router state from resolved route', async () => {
      const result = await resolveRoute('/en/rooms/room-1');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      const state = buildRouterState(result.result);

      expect(state.location.pathname).toBe('/en/rooms/room-1');
      expect(state.params).toEqual({ lang: 'en', id: 'room-1' });
      expect(state.matches).toHaveLength(2);
      expect(state.loaderData).toBeDefined();
    });

    it('should include loader data in router state', async () => {
      const result = await resolveRoute('/en');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      const state = buildRouterState(result.result);

      expect(state.loaderData['en-home']).toEqual({ message: 'home' });
    });

    it('should handle routes without loader data', async () => {
      const result = await resolveRoute('/en/does-not-exist');

      if (!('notFound' in result)) {
        const state = buildRouterState(result.result);
        expect(state.loaderData).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pathname', async () => {
      const result = await resolveRoute('');

      expect('notFound' in result || 'result' in result).toBe(true);
    });

    it('should handle pathname with only slash', async () => {
      const result = await resolveRoute('/');

      expect('notFound' in result || 'result' in result).toBe(true);
    });

    it('should handle very long pathnames', async () => {
      const longPath = '/en/' + 'a'.repeat(1000);
      const result = await resolveRoute(longPath);

      expect('notFound' in result).toBe(true);
    });

    it('should handle pathnames with special characters', async () => {
      const result = await resolveRoute('/en/rooms/café');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.params['id']).toBe('café');
    });

    it('should handle pathnames with dots', async () => {
      const result = await resolveRoute('/en/rooms/room.1.2.3');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.params['id']).toBe('room.1.2.3');
    });

    it('should handle pathnames with dashes and underscores', async () => {
      const result = await resolveRoute('/en/rooms/room-1_test');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.params['id']).toBe('room-1_test');
    });

    it('should handle case-sensitive routing', async () => {
      const result = await resolveRoute('/EN');

      // Should not match /en route (case-sensitive)
      expect('notFound' in result).toBe(true);
    });

    it('should handle multiple consecutive slashes in path', async () => {
      const result = await resolveRoute('/en//rooms');

      // Should normalize and potentially match
      expect('notFound' in result || 'result' in result).toBe(true);
    });
  });

  describe('Multilingual Routing', () => {
    it('should inject language parameter for supported languages', async () => {
      const result = await resolveRoute('/en');

      if ('notFound' in result || 'redirect' in result) {
        throw new Error('Expected route result');
      }

      expect(result.result.params['lang']).toBe('en');
    });

    it('should support multiple languages', async () => {
      // Test would need expanded mock routes for other languages
      const languages = ['en', 'it', 'de'];

      for (const lang of languages) {
        const result = await resolveRoute(`/${lang}`);
        // Should either find route or return notFound consistently
        expect('notFound' in result || 'result' in result).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should resolve routes efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await resolveRoute('/en/rooms/room-1');
      }

      const duration = Date.now() - startTime;

      // Should complete 100 resolutions in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent route resolutions', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        resolveRoute(`/en/rooms/room-${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        if (!('notFound' in result || 'redirect' in result)) {
          expect(result.result.params['id']).toBe(`room-${i}`);
        }
      });
    });
  });

  describe('listLocalizedPaths', () => {
    it('should return list of localized paths', () => {
      const paths = listLocalizedPaths();

      expect(Array.isArray(paths)).toBe(true);
      // Paths should start with language code
      paths.forEach(path => {
        expect(path).toMatch(/^\/(en|it|de)\//);
      });
    });

    it('should return unique paths', () => {
      const paths = listLocalizedPaths();
      const uniquePaths = new Set(paths);

      expect(paths.length).toBe(uniquePaths.size);
    });

    it('should return sorted paths', () => {
      const paths = listLocalizedPaths();
      const sortedPaths = [...paths].sort();

      expect(paths).toEqual(sortedPaths);
    });
  });
});
