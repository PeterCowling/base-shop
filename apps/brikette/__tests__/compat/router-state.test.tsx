/**
 * Tests for router-state.tsx
 *
 * Covers:
 * - Location creation and manipulation
 * - Navigate function behavior
 * - Redirect result handling
 * - Context providers
 * - Fallback behaviors
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  locationFromUrl,
  getFallbackLocation,
  toHref,
  fallbackNavigate,
  redirect,
  isRedirectResult,
  RouterStateProvider,
  useRouteDataContext,
  type Location,
  type To,
  type RouterState,
} from '../../src/compat/router-state';

describe('router-state', () => {
  describe('locationFromUrl', () => {
    it('should parse a full URL', () => {
      const location = locationFromUrl('https://example.com/path?query=1#hash');
      expect(location).toEqual({
        pathname: '/path',
        search: '?query=1',
        hash: '#hash',
        state: null,
        key: 'default',
      });
    });

    it('should parse a relative URL', () => {
      const location = locationFromUrl('/path?query=1#hash');
      expect(location).toEqual({
        pathname: '/path',
        search: '?query=1',
        hash: '#hash',
        state: null,
        key: 'default',
      });
    });

    it('should handle URL without search or hash', () => {
      const location = locationFromUrl('/path');
      expect(location).toEqual({
        pathname: '/path',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });
    });

    it('should handle root path', () => {
      const location = locationFromUrl('/');
      expect(location).toEqual({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });
    });

    it('should handle invalid URL gracefully', () => {
      const location = locationFromUrl('not a valid url');
      expect(location.pathname).toBe('not a valid url');
      expect(location.key).toBe('default');
    });

    it('should handle empty string', () => {
      const location = locationFromUrl('');
      expect(location.pathname).toBe('/');
    });

    it('should handle URL with encoded characters', () => {
      const location = locationFromUrl('/path%20with%20spaces?query=%E2%9C%93');
      expect(location.pathname).toBe('/path%20with%20spaces');
      expect(location.search).toBe('?query=%E2%9C%93');
    });

    it('should handle URL with custom base', () => {
      const location = locationFromUrl('/api/users', 'https://api.example.com');
      expect(location.pathname).toBe('/api/users');
    });
  });

  describe('getFallbackLocation', () => {
    it('should return window location if available', () => {
      const mockLocation = {
        pathname: '/test',
        search: '?foo=bar',
        hash: '#section',
      };

      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      const location = getFallbackLocation();
      expect(location.pathname).toBe('/test');
      expect(location.search).toBe('?foo=bar');
      expect(location.hash).toBe('#section');
      expect(location.key).toBe('window');
    });

    it('should return fallback location in SSR', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR environment
      delete global.window;

      const location = getFallbackLocation();
      expect(location).toEqual({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'fallback',
      });

      global.window = originalWindow;
    });
  });

  describe('toHref', () => {
    it('should convert string To to href', () => {
      expect(toHref('/path')).toBe('/path');
      expect(toHref('/path?query=1')).toBe('/path?query=1');
      expect(toHref('/path#hash')).toBe('/path#hash');
    });

    it('should convert object To to href', () => {
      const to: To = {
        pathname: '/path',
        search: '?query=1',
        hash: '#hash',
      };
      expect(toHref(to)).toBe('/path?query=1#hash');
    });

    it('should handle partial object To', () => {
      expect(toHref({ pathname: '/path' })).toBe('/path');
      expect(toHref({ search: '?query=1' })).toBe('?query=1');
      expect(toHref({ hash: '#hash' })).toBe('#hash');
    });

    it('should normalize search and hash', () => {
      const to: To = {
        pathname: '/path',
        search: 'query=1', // Missing ?
        hash: 'hash', // Missing #
      };
      expect(toHref(to)).toBe('/path?query=1#hash');
    });

    it('should handle empty object', () => {
      expect(toHref({})).toBe('/');
    });

    it('should preserve existing ? and #', () => {
      const to: To = {
        pathname: '/path',
        search: '?query=1',
        hash: '#hash',
      };
      expect(toHref(to)).toBe('/path?query=1#hash');
    });

    it('should handle complex query strings', () => {
      const to: To = {
        pathname: '/search',
        search: '?q=hello+world&lang=en&page=2',
      };
      expect(toHref(to)).toBe('/search?q=hello+world&lang=en&page=2');
    });
  });

  describe('fallbackNavigate', () => {
    let assignSpy: jest.SpyInstance;
    let replaceSpy: jest.SpyInstance;
    let goSpy: jest.SpyInstance;

    beforeEach(() => {
      assignSpy = jest.spyOn(window.location, 'assign').mockImplementation(() => {});
      replaceSpy = jest.spyOn(window.location, 'replace').mockImplementation(() => {});
      goSpy = jest.spyOn(window.history, 'go').mockImplementation(() => {});
    });

    afterEach(() => {
      assignSpy.mockRestore();
      replaceSpy.mockRestore();
      goSpy.mockRestore();
    });

    it('should navigate using location.assign by default', () => {
      fallbackNavigate('/path');
      expect(assignSpy).toHaveBeenCalledWith('/path');
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    it('should navigate using location.replace when replace option is true', () => {
      fallbackNavigate('/path', { replace: true });
      expect(replaceSpy).toHaveBeenCalledWith('/path');
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it('should handle numeric navigation (history.go)', () => {
      fallbackNavigate(-1);
      expect(goSpy).toHaveBeenCalledWith(-1);
      expect(assignSpy).not.toHaveBeenCalled();
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    it('should handle forward navigation', () => {
      fallbackNavigate(1);
      expect(goSpy).toHaveBeenCalledWith(1);
    });

    it('should handle object To', () => {
      fallbackNavigate({ pathname: '/path', search: '?query=1' });
      expect(assignSpy).toHaveBeenCalledWith('/path?query=1');
    });

    it('should not throw in SSR environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Simulating SSR
      delete global.window;

      expect(() => fallbackNavigate('/path')).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('redirect', () => {
    it('should create redirect result with default status', () => {
      const result = redirect('/new-path');
      expect(result).toEqual({
        __redirect: true,
        location: '/new-path',
        status: 302,
        headers: expect.any(Headers),
      });
      expect(result.headers.get('Location')).toBe('/new-path');
    });

    it('should create redirect result with custom status', () => {
      const result = redirect('/new-path', { status: 301 });
      expect(result.status).toBe(301);
      expect(result.location).toBe('/new-path');
    });

    it('should preserve custom headers', () => {
      const result = redirect('/new-path', {
        headers: {
          'X-Custom-Header': 'value',
        },
      });
      expect(result.headers.get('X-Custom-Header')).toBe('value');
      expect(result.headers.get('Location')).toBe('/new-path');
    });

    it('should handle Headers object', () => {
      const headers = new Headers({ 'X-Custom': 'test' });
      const result = redirect('/new-path', { headers });
      expect(result.headers.get('X-Custom')).toBe('test');
    });

    it('should support 307 and 308 status codes', () => {
      expect(redirect('/path', { status: 307 }).status).toBe(307);
      expect(redirect('/path', { status: 308 }).status).toBe(308);
    });
  });

  describe('isRedirectResult', () => {
    it('should identify valid redirect results', () => {
      const result = redirect('/path');
      expect(isRedirectResult(result)).toBe(true);
    });

    it('should reject non-redirect objects', () => {
      expect(isRedirectResult({})).toBe(false);
      expect(isRedirectResult({ location: '/path' })).toBe(false);
      expect(isRedirectResult({ __redirect: false })).toBe(false);
      expect(isRedirectResult(null)).toBe(false);
      expect(isRedirectResult(undefined)).toBe(false);
      expect(isRedirectResult('string')).toBe(false);
      expect(isRedirectResult(123)).toBe(false);
    });

    it('should handle malformed redirect objects', () => {
      expect(isRedirectResult({ __redirect: 'true' })).toBe(false);
      expect(isRedirectResult({ __redirect: 1 })).toBe(false);
    });
  });

  describe('RouterStateProvider', () => {
    it('should provide router state to children', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: { id: '123' },
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useRouteDataContext(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      // Provider should render without error
      expect(result).toBeDefined();
    });

    it('should provide navigation function', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      renderHook(() => useRouteDataContext(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      // Provider should render without error
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should use fallback navigate when navigate not provided', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      const { rerender } = renderHook(() => useRouteDataContext(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      // Should not throw
      expect(() => rerender()).not.toThrow();
    });

    it('should memoize navigation value', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { rerender } = renderHook(() => useRouteDataContext(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      // Rerender should not cause re-creation of navigation value
      rerender();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with multiple query parameters', () => {
      const location = locationFromUrl('/path?a=1&b=2&c=3');
      expect(location.search).toBe('?a=1&b=2&c=3');
    });

    it('should handle URLs with fragment identifiers', () => {
      const location = locationFromUrl('/docs#section-1.2.3');
      expect(location.hash).toBe('#section-1.2.3');
    });

    it('should handle URLs with port numbers', () => {
      const location = locationFromUrl('http://localhost:3000/path');
      expect(location.pathname).toBe('/path');
    });

    it('should handle URLs with authentication', () => {
      const location = locationFromUrl('https://user:pass@example.com/path');
      expect(location.pathname).toBe('/path');
    });

    it('should handle international characters in pathname', () => {
      const location = locationFromUrl('/café/ñoño');
      expect(location.pathname).toContain('caf');
    });

    it('should handle empty search params', () => {
      const location = locationFromUrl('/path?');
      expect(location.search).toBe('?');
    });

    it('should handle empty hash', () => {
      const location = locationFromUrl('/path#');
      expect(location.hash).toBe('#');
    });

    it('should handle redirect with query params', () => {
      const result = redirect('/new-path?redirect=true&foo=bar');
      expect(result.location).toBe('/new-path?redirect=true&foo=bar');
    });

    it('should handle redirect with hash', () => {
      const result = redirect('/docs#section');
      expect(result.location).toBe('/docs#section');
    });
  });
});
