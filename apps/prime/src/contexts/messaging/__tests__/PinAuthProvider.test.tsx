import { renderHook, act } from '@testing-library/react';
import { PinAuthProvider, usePinAuth } from '../PinAuthProvider';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('usePinAuth', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('without PinAuthProvider (SSR-safe default)', () => {
    it('returns safe defaults instead of throwing', () => {
      const { result } = renderHook(() => usePinAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('login returns false', async () => {
      const { result } = renderHook(() => usePinAuth());

      const success = await result.current.login('1234');
      expect(success).toBe(false);
    });

    it('logout is a no-op', () => {
      const { result } = renderHook(() => usePinAuth());

      expect(() => result.current.logout()).not.toThrow();
    });
  });

  describe('with PinAuthProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PinAuthProvider>{children}</PinAuthProvider>
    );

    it('starts unauthenticated', () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('login with valid PIN sets user and role', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let success: boolean;
      await act(async () => {
        success = await result.current.login('1234');
      });

      expect(success!).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.role).toBe('staff');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('login with short PIN fails', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      let success: boolean;
      await act(async () => {
        success = await result.current.login('123');
      });

      expect(success!).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('logout clears user and role', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.login('1234');
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('login persists to localStorage', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.login('1234');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('prime_role', 'staff');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prime_user_id',
        expect.stringContaining('user_'),
      );
    });

    it('logout removes from localStorage', async () => {
      const { result } = renderHook(() => usePinAuth(), { wrapper });

      await act(async () => {
        await result.current.login('1234');
      });
      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('prime_role');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('prime_user_id');
    });

    it('restores session from localStorage on mount', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'prime_role') return 'admin';
        if (key === 'prime_user_id') return 'user_existing';
        return null;
      });

      const { result } = renderHook(() => usePinAuth(), { wrapper });

      expect(result.current.user).toEqual({ id: 'user_existing' });
      expect(result.current.role).toBe('admin');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
