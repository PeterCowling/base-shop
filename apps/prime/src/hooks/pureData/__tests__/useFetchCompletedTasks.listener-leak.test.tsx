import { renderHook, waitFor } from '@testing-library/react';

import useUuid from '../../useUuid';
import { useFetchCompletedTasks } from '../useFetchCompletedTasksData';

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

const mockRef = jest.fn();
const mockOnValue = jest.fn();
const sharedDatabase = { id: 'db' };
const mockUseFirebaseDatabase = jest.fn(() => sharedDatabase);

let activeListeners = 0;

jest.mock('@/services/firebase', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
}));

jest.mock('../../../services/useFirebase', () => ({
  useFirebaseDatabase: () => mockUseFirebaseDatabase(),
}));

jest.mock('../../useUuid', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseUuid = useUuid as jest.MockedFunction<typeof useUuid>;

describe('useFetchCompletedTasks listener lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeListeners = 0;

    mockRef.mockImplementation((_database: unknown, path: string) => ({
      toString: () => path,
    }));

    mockOnValue.mockImplementation(
      (
        _query: unknown,
        callback: (snapshot: MockSnapshot) => void,
        _errorCallback?: (error: Error) => void,
      ) => {
        activeListeners += 1;
        callback(createMockSnapshot({ cashPrepared: true }));

        let unsubscribed = false;
        return () => {
          if (!unsubscribed) {
            unsubscribed = true;
            activeListeners = Math.max(0, activeListeners - 1);
          }
        };
      },
    );
  });

  it('TC-01: mount and unmount returns active listener count to baseline', async () => {
    mockedUseUuid.mockReturnValue('occ_1234567890123');
    const { unmount } = renderHook(() => useFetchCompletedTasks());

    await waitFor(() => {
      expect(activeListeners).toBe(1);
    });

    unmount();
    expect(activeListeners).toBe(0);
  });

  it('TC-02: uuid change unsubscribes old listener before subscribing new listener', async () => {
    let currentUuid = 'occ_1111111111111';
    mockedUseUuid.mockImplementation(() => currentUuid);

    const { rerender, unmount } = renderHook(() => useFetchCompletedTasks());

    await waitFor(() => {
      expect(activeListeners).toBe(1);
      expect(mockOnValue).toHaveBeenCalledTimes(1);
    });

    currentUuid = 'occ_2222222222222';
    rerender();

    await waitFor(() => {
      expect(activeListeners).toBe(1);
      expect(mockOnValue).toHaveBeenCalledTimes(2);
    });

    unmount();
    expect(activeListeners).toBe(0);
  });

  it('TC-03: repeated route toggles keep steady-state listener count stable', async () => {
    mockedUseUuid.mockReturnValue('occ_3333333333333');

    for (let index = 0; index < 4; index += 1) {
      const view = renderHook(() => useFetchCompletedTasks());
      await waitFor(() => {
        expect(activeListeners).toBe(1);
      });
      view.unmount();
      expect(activeListeners).toBe(0);
    }
  });

  it('TC-04: listener error path still executes cleanup', async () => {
    mockedUseUuid.mockReturnValue('occ_4444444444444');

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

    const { result, unmount } = renderHook(() => useFetchCompletedTasks());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(activeListeners).toBe(1);
    });

    unmount();
    expect(activeListeners).toBe(0);
  });
});
