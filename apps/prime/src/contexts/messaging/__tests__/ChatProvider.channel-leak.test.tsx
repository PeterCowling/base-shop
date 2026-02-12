/**
 * ChatProvider Channel Listener Leak Test (TASK-45)
 *
 * TC-04: Repeated route enter/leave cycles keep listener count at baseline
 *
 * Validates that channel message listeners are properly cleaned up when
 * currentChannelId changes, preventing memory leaks.
 */

import { type ReactNode } from 'react';
import { act,renderHook, waitFor } from '@testing-library/react';

import { ChatProvider, useChat } from '../ChatProvider';

type MockSnapshot = {
  exists: () => boolean;
  val: () => unknown;
  key: string | null;
};

function createMockSnapshot(value: unknown, key: string | null = null): MockSnapshot {
  return {
    exists: () => value !== null && value !== undefined,
    val: () => value,
    key,
  };
}

const mockOnValue = jest.fn();
const mockOnChildAdded = jest.fn();
const mockOnChildChanged = jest.fn();
const mockOnChildRemoved = jest.fn();
const mockOff = jest.fn();
const mockGet = jest.fn();
const mockQuery = jest.fn();
const mockRef = jest.fn();

let activeListeners = 0;

jest.mock('@/services/firebase', () => ({
  db: { id: 'db' },
  firebaseApp: { name: '[DEFAULT]' },
  storage: { id: 'storage' },
  get: (...args: unknown[]) => mockGet(...args),
  off: (...args: unknown[]) => mockOff(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  onChildAdded: (...args: unknown[]) => mockOnChildAdded(...args),
  onChildChanged: (...args: unknown[]) => mockOnChildChanged(...args),
  onChildRemoved: (...args: unknown[]) => mockOnChildRemoved(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  ref: (...args: unknown[]) => mockRef(...args),
  orderByChild: jest.fn((field: string) => ({ _orderBy: field })),
  limitToLast: jest.fn((limit: number) => ({ _limit: limit })),
  limitToFirst: jest.fn((limit: number) => ({ _limit: limit })),
  startAt: jest.fn((val: unknown) => ({ _startAt: val })),
  endAt: jest.fn((val: unknown) => ({ _endAt: val })),
  equalTo: jest.fn((val: unknown) => ({ _equalTo: val })),
  endBefore: jest.fn((val: unknown) => ({ _endBefore: val })),
  push: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
}));

const mockDb = { id: 'db' };

jest.mock('@/services/useFirebase', () => ({
  useFirebaseDatabase: jest.fn(() => mockDb),
}));

jest.mock('@/utils/messaging/dbRoot', () => ({
  MSG_ROOT: 'messaging',
}));

describe('ChatProvider Channel Listener Lifecycle (TASK-45 TC-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeListeners = 0;

    mockRef.mockImplementation((_db: unknown, path: string) => ({
      toString: () => path,
      _path: path,
    }));

    mockQuery.mockImplementation((...args: unknown[]) => ({
      toString: () => 'query',
      _args: args,
    }));

    // Mock onValue for activities query (always returns empty)
    // Use queueMicrotask to avoid setState during render
    mockOnValue.mockImplementation(
      (
        _query: unknown,
        callback: (snapshot: MockSnapshot) => void,
      ) => {
        queueMicrotask(() => callback(createMockSnapshot({})));
        return () => {};
      },
    );

    // Mock get for initial message load
    mockGet.mockResolvedValue(createMockSnapshot({}));

    // Mock child listeners with tracking
    const createChildListener = () => {
      activeListeners += 1;
      let unsubscribed = false;
      return () => {
        if (!unsubscribed) {
          unsubscribed = true;
          activeListeners = Math.max(0, activeListeners - 1);
        }
      };
    };

    mockOnChildAdded.mockImplementation(() => createChildListener());
    mockOnChildChanged.mockImplementation(() => createChildListener());
    mockOnChildRemoved.mockImplementation(() => createChildListener());
  });

  it('TC-04: mount and unmount returns active listener count to baseline', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result, unmount } = renderHook(() => useChat(), { wrapper });

    // Set channel ID to start listening
    await act(async () => {
      result.current.setCurrentChannelId('channel_1');
    });

    // Wait for listeners to be established (3 child listeners per channel)
    await waitFor(
      () => {
        expect(activeListeners).toBe(3);
      },
      { timeout: 3000 },
    );

    // Unmount should clean up all listeners
    unmount();

    await waitFor(
      () => {
        expect(activeListeners).toBe(0);
      },
      { timeout: 1000 },
    );
  }, 10000);

  it('TC-04: channel change unsubscribes old listeners before subscribing new ones', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    // Subscribe to channel 1
    await act(async () => {
      result.current.setCurrentChannelId('channel_1');
    });

    await waitFor(
      () => {
        expect(activeListeners).toBe(3);
      },
      { timeout: 3000 },
    );

    // Switch to channel 2
    await act(async () => {
      result.current.setCurrentChannelId('channel_2');
    });

    await waitFor(
      () => {
        // Should still be 3 (old cleaned up, new added)
        expect(activeListeners).toBe(3);
      },
      { timeout: 3000 },
    );

    // Switch to null (no channel)
    await act(async () => {
      result.current.setCurrentChannelId(null);
    });

    await waitFor(
      () => {
        expect(activeListeners).toBe(0);
      },
      { timeout: 1000 },
    );
  }, 15000);

  it('TC-04: repeated enter/leave cycles maintain baseline', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    // Cycle through channels multiple times
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        result.current.setCurrentChannelId(`channel_${i}`);
      });

      await waitFor(
        () => {
          expect(activeListeners).toBe(3);
        },
        { timeout: 3000 },
      );

      await act(async () => {
        result.current.setCurrentChannelId(null);
      });

      await waitFor(
        () => {
          expect(activeListeners).toBe(0);
        },
        { timeout: 1000 },
      );
    }

    // Final check - should be at baseline
    expect(activeListeners).toBe(0);
  }, 30000);
});
