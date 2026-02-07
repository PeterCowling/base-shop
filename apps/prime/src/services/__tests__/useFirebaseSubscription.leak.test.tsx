import { renderHook, waitFor } from '@testing-library/react';
import { useFirebaseSubscription } from '../useFirebase';

type MockSnapshot = {
  exists: () => boolean;
  val: () => unknown;
};

function createMockSnapshot(value: unknown): MockSnapshot {
  return {
    exists: () => value !== null && value !== undefined,
    val: () => value,
  };
}

const mockOnValue = jest.fn();
const mockOff = jest.fn();
const mockGet = jest.fn();

let activeListeners = 0;

jest.mock('@/services/firebase', () => ({
  db: { id: 'db' },
  firebaseApp: { name: '[DEFAULT]' },
  storage: { id: 'storage' },
  get: (...args: unknown[]) => mockGet(...args),
  off: (...args: unknown[]) => mockOff(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
}));

function createQuery(path: string) {
  return {
    toString: () => path,
  } as any;
}

describe('useFirebaseSubscription listener lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeListeners = 0;

    mockOnValue.mockImplementation(
      (
        _query: unknown,
        callback: (snapshot: MockSnapshot) => void,
        _errorCallback?: (error: Error) => void,
      ) => {
        activeListeners += 1;
        callback(createMockSnapshot({ ok: true }));

        let unsubscribed = false;
        return () => {
          if (!unsubscribed) {
            unsubscribed = true;
            activeListeners = Math.max(0, activeListeners - 1);
          }
        };
      },
    );

    mockGet.mockResolvedValue(createMockSnapshot({ refreshed: true }));
  });

  it('TC-01: mount and unmount returns active listener count to baseline', async () => {
    const query = createQuery('completedTasks/occ_1234567890123');
    const { unmount } = renderHook(() =>
      useFirebaseSubscription<{ ok: boolean }>(query),
    );

    await waitFor(() => {
      expect(activeListeners).toBe(1);
    });

    unmount();
    expect(activeListeners).toBe(0);
  });

  it('TC-02: query change unsubscribes old listener before subscribing new listener', async () => {
    const queryA = createQuery('completedTasks/occ_A');
    const queryB = createQuery('completedTasks/occ_B');

    const { rerender, unmount } = renderHook(
      ({ query }) => useFirebaseSubscription<{ ok: boolean }>(query),
      {
        initialProps: { query: queryA },
      },
    );

    await waitFor(() => {
      expect(activeListeners).toBe(1);
      expect(mockOnValue).toHaveBeenCalledTimes(1);
    });

    rerender({ query: queryB });

    await waitFor(() => {
      expect(activeListeners).toBe(1);
      expect(mockOnValue).toHaveBeenCalledTimes(2);
    });

    expect(mockOff).toHaveBeenCalledWith(queryA);

    unmount();
    expect(activeListeners).toBe(0);
  });

  it('TC-03: repeated route toggles do not increase steady-state listener count', async () => {
    const query = createQuery('completedTasks/occ_repeat');

    for (let index = 0; index < 4; index += 1) {
      const view = renderHook(() =>
        useFirebaseSubscription<{ ok: boolean }>(query),
      );
      await waitFor(() => {
        expect(activeListeners).toBe(1);
      });
      view.unmount();
      expect(activeListeners).toBe(0);
    }
  });

  it('TC-04: listener error path still executes cleanup', async () => {
    const query = createQuery('completedTasks/occ_error');
    mockOnValue.mockImplementationOnce(
      (
        _query: unknown,
        _callback: (snapshot: MockSnapshot) => void,
        errorCallback?: (error: Error) => void,
      ) => {
        activeListeners += 1;
        errorCallback?.(new Error('listener failed'));

        let unsubscribed = false;
        return () => {
          if (!unsubscribed) {
            unsubscribed = true;
            activeListeners = Math.max(0, activeListeners - 1);
          }
        };
      },
    );

    const { result, unmount } = renderHook(() =>
      useFirebaseSubscription<{ ok: boolean }>(query),
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(activeListeners).toBe(1);
    });

    unmount();
    expect(activeListeners).toBe(0);
  });
});
