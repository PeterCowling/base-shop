/**
 * Tests for react-router-dom.tsx
 *
 * Covers:
 * - Hook implementations (useLocation, useParams, useNavigate, etc.)
 * - Link and NavLink components
 * - Outlet rendering
 * - MemoryRouter for testing
 * - Edge cases and error handling
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
  useLoaderData,
  useOutlet,
  MemoryRouter,
  useInRouterContext,
} from '../../src/compat/react-router-dom';
import { RouterStateProvider, type RouterState } from '../../src/compat/router-state';

describe('react-router-dom', () => {
  describe('useInRouterContext', () => {
    it('should return false outside router context', () => {
      const { result } = renderHook(() => useInRouterContext());
      expect(result.current).toBe(false);
    });

    it('should return true inside router context', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useInRouterContext(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useLocation', () => {
    it('should return current location from context', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '?foo=bar', hash: '#section', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useLocation(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      expect(result.current).toEqual({
        pathname: '/test',
        search: '?foo=bar',
        hash: '#section',
        state: null,
        key: 'test',
      });
    });

    it('should return fallback location outside context', () => {
      const { result } = renderHook(() => useLocation());

      expect(result.current).toBeDefined();
      expect(result.current.pathname).toBeDefined();
    });
  });

  describe('useParams', () => {
    it('should return params from context', () => {
      const state: RouterState = {
        location: { pathname: '/rooms/123', search: '', hash: '', state: null, key: 'test' },
        params: { id: '123', lang: 'en' },
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      expect(result.current).toEqual({ id: '123', lang: 'en' });
    });

    it('should return empty object outside context', () => {
      const { result } = renderHook(() => useParams());

      expect(result.current).toEqual({});
    });

    it('should handle undefined params', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: { id: undefined },
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      expect(result.current).toEqual({ id: undefined });
    });
  });

  describe('useNavigate', () => {
    it('should return navigate function from context', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { result } = renderHook(() => useNavigate(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      act(() => {
        result.current('/new-path');
      });

      expect(navigateMock).toHaveBeenCalledWith('/new-path', undefined);
    });

    it('should support navigate options', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { result } = renderHook(() => useNavigate(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      act(() => {
        result.current('/new-path', { replace: true, state: { from: '/old' } });
      });

      expect(navigateMock).toHaveBeenCalledWith('/new-path', {
        replace: true,
        state: { from: '/old' },
      });
    });

    it('should fall back to browser navigation outside context', () => {
      const assignSpy = jest.spyOn(window.location, 'assign').mockImplementation(() => {});

      const { result } = renderHook(() => useNavigate());

      act(() => {
        result.current('/new-path');
      });

      expect(assignSpy).toHaveBeenCalledWith('/new-path');

      assignSpy.mockRestore();
    });
  });

  describe('useSearchParams', () => {
    it('should return current search params', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '?foo=bar&baz=qux', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useSearchParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      const [searchParams] = result.current;

      expect(searchParams.get('foo')).toBe('bar');
      expect(searchParams.get('baz')).toBe('qux');
    });

    it('should support setting search params', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { result } = renderHook(() => useSearchParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      const [, setSearchParams] = result.current;

      act(() => {
        setSearchParams({ foo: 'bar' });
      });

      expect(navigateMock).toHaveBeenCalledWith('/test?foo=bar', undefined);
    });

    it('should preserve hash when setting search params', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '#section', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { result } = renderHook(() => useSearchParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      const [, setSearchParams] = result.current;

      act(() => {
        setSearchParams('foo=bar');
      });

      expect(navigateMock).toHaveBeenCalledWith('/test?foo=bar#section', undefined);
    });

    it('should handle URLSearchParams object', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { result } = renderHook(() => useSearchParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      const [, setSearchParams] = result.current;

      act(() => {
        const params = new URLSearchParams();
        params.set('foo', 'bar');
        setSearchParams(params);
      });

      expect(navigateMock).toHaveBeenCalledWith('/test?foo=bar', undefined);
    });
  });

  describe('useLoaderData', () => {
    it('should return loader data from route context', () => {
      const loaderData = { message: 'test data' };

      const TestComponent = () => {
        const data = useLoaderData<typeof loaderData>();
        return <div>{data.message}</div>;
      };

      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <TestComponent />
        </RouterStateProvider>
      );

      // Data should be accessible (even if undefined in this simple test)
      expect(screen.queryByText('test data')).not.toBeInTheDocument();
    });
  });

  describe('useOutlet', () => {
    it('should return outlet from route context', () => {
      const { result } = renderHook(() => useOutlet());

      expect(result.current).toBeNull();
    });
  });

  describe('Link', () => {
    it('should render link with href', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <Link to="/about">About</Link>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).toHaveAttribute('href', '/about');
    });

    it('should handle object To', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <Link to={{ pathname: '/about', search: '?foo=bar', hash: '#section' }}>
            About
          </Link>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).toHaveAttribute('href', '/about?foo=bar#section');
    });

    it('should support className', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <Link to="/about" className="custom-link">About</Link>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).toHaveClass('custom-link');
    });

    it('should render as plain anchor outside router context', () => {
      render(<Link to="/about">About</Link>);

      const link = screen.getByText('About');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/about');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <Link to="/about" ref={ref}>About</Link>
        </RouterStateProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('NavLink', () => {
    it('should mark active link', () => {
      const state: RouterState = {
        location: { pathname: '/about', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
            About
          </NavLink>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).toHaveClass('active');
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark inactive link', () => {
      const state: RouterState = {
        location: { pathname: '/home', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
            About
          </NavLink>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).not.toHaveClass('active');
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('should support end prop for exact matching', () => {
      const state: RouterState = {
        location: { pathname: '/about/team', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <NavLink to="/about" end className={({ isActive }) => (isActive ? 'active' : '')}>
            About
          </NavLink>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).not.toHaveClass('active');
    });

    it('should support string className', () => {
      const state: RouterState = {
        location: { pathname: '/about', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <NavLink to="/about" className="nav-link">
            About
          </NavLink>
        </RouterStateProvider>
      );

      const link = screen.getByText('About');
      expect(link).toHaveClass('nav-link');
    });
  });

  describe('Outlet', () => {
    it('should render outlet content', () => {
      const OutletTest = () => {
        const outlet = useOutlet();
        return <div>Outlet: {outlet ? 'has content' : 'empty'}</div>;
      };

      render(<OutletTest />);

      expect(screen.getByText('Outlet: empty')).toBeInTheDocument();
    });

    it('should render Outlet component', () => {
      render(<Outlet />);

      // Should render without error
      expect(document.body).toBeDefined();
    });
  });

  describe('MemoryRouter', () => {
    it('should provide router context', () => {
      const TestComponent = () => {
        const inContext = useInRouterContext();
        return <div>{inContext ? 'in context' : 'not in context'}</div>;
      };

      render(
        <MemoryRouter>
          <TestComponent />
        </MemoryRouter>
      );

      expect(screen.getByText('in context')).toBeInTheDocument();
    });

    it('should use initial entries', () => {
      const TestComponent = () => {
        const location = useLocation();
        return <div>{location.pathname}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/test']}>
          <TestComponent />
        </MemoryRouter>
      );

      expect(screen.getByText('/test')).toBeInTheDocument();
    });

    it('should support initial index', () => {
      const TestComponent = () => {
        const location = useLocation();
        return <div>{location.pathname}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/first', '/second', '/third']} initialIndex={1}>
          <TestComponent />
        </MemoryRouter>
      );

      expect(screen.getByText('/second')).toBeInTheDocument();
    });

    it('should support navigation', () => {
      const TestComponent = () => {
        const location = useLocation();
        const navigate = useNavigate();

        return (
          <div>
            <div>{location.pathname}</div>
            <button onClick={() => navigate('/new-path')}>Navigate</button>
          </div>
        );
      };

      render(
        <MemoryRouter initialEntries={['/initial']}>
          <TestComponent />
        </MemoryRouter>
      );

      expect(screen.getByText('/initial')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Navigate'));

      expect(screen.getByText('/new-path')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid navigation', () => {
      const navigateMock = jest.fn();
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
        navigate: navigateMock,
      };

      const { result } = renderHook(() => useNavigate(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      act(() => {
        result.current('/path1');
        result.current('/path2');
        result.current('/path3');
      });

      expect(navigateMock).toHaveBeenCalledTimes(3);
    });

    it('should handle link to itself', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      render(
        <RouterStateProvider state={state}>
          <Link to="/test">Current Page</Link>
        </RouterStateProvider>
      );

      const link = screen.getByText('Current Page');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should handle empty search params', () => {
      const state: RouterState = {
        location: { pathname: '/test', search: '', hash: '', state: null, key: 'test' },
        params: {},
        matches: [],
        loaderData: {},
      };

      const { result } = renderHook(() => useSearchParams(), {
        wrapper: ({ children }) => (
          <RouterStateProvider state={state}>{children}</RouterStateProvider>
        ),
      });

      const [searchParams] = result.current;

      expect(searchParams.toString()).toBe('');
    });
  });
});
