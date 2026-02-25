/**
 * ChatProvider direct-message guard tests
 *
 * Ensures direct channel reads and sends route through function endpoints and
 * enforce booking/channel invariants before network calls.
 */

import { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { ChatProvider, useChat } from '../ChatProvider';

const mockReadGuestSession = jest.fn(() => ({
  bookingId: 'booking123',
  firstName: 'Guest',
  token: 'token_123',
  uuid: 'guest_abc',
  verifiedAt: null,
}));

jest.mock('@/lib/auth/guestSessionGuard', () => ({
  readGuestSession: () => mockReadGuestSession(),
}));

const mockPush = jest.fn();
jest.mock('firebase/database', () => ({
  push: (...args: unknown[]) => mockPush(...args),
}));

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockRef = jest.fn();
const mockQuery = jest.fn();
const mockOnValue = jest.fn();
const mockOnChildAdded = jest.fn();
const mockOnChildChanged = jest.fn();
const mockOnChildRemoved = jest.fn();
const mockOff = jest.fn();
const mockFetch = jest.fn();

function createDirectSendSuccessResponse(): Response {
  return new Response(
    JSON.stringify({
      success: true,
      messageId: 'msg_1',
      createdAt: Date.now(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return typeof input.url === 'string' ? input.url : String(input);
}

jest.mock('@/services/firebase', () => ({
  db: { id: 'db' },
  firebaseApp: { name: '[DEFAULT]' },
  storage: { id: 'storage' },
  endAt: jest.fn((value: unknown) => ({ _endAt: value })),
  endBefore: jest.fn((value: unknown) => ({ _endBefore: value })),
  equalTo: jest.fn((value: unknown) => ({ _equalTo: value })),
  get: (...args: unknown[]) => mockGet(...args),
  limitToFirst: jest.fn((value: number) => ({ _limitToFirst: value })),
  limitToLast: jest.fn((value: number) => ({ _limitToLast: value })),
  off: (...args: unknown[]) => mockOff(...args),
  onChildAdded: (...args: unknown[]) => mockOnChildAdded(...args),
  onChildChanged: (...args: unknown[]) => mockOnChildChanged(...args),
  onChildRemoved: (...args: unknown[]) => mockOnChildRemoved(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  orderByChild: jest.fn((value: string) => ({ _orderByChild: value })),
  query: (...args: unknown[]) => mockQuery(...args),
  ref: (...args: unknown[]) => mockRef(...args),
  set: (...args: unknown[]) => mockSet(...args),
  startAt: jest.fn((value: unknown) => ({ _startAt: value })),
  update: (...args: unknown[]) => mockUpdate(...args),
}));

jest.mock('@/services/useFirebase', () => ({
  useFirebaseDatabase: jest.fn(() => ({ id: 'db' })),
}));

describe('ChatProvider direct-message guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRef.mockImplementation((_db: unknown, path: string) => ({
      _path: path,
      toString: () => path,
    }));

    mockQuery.mockImplementation((...args: unknown[]) => ({
      _args: args,
      toString: () => 'query',
    }));

    mockOnValue.mockImplementation(() => () => {});
    mockOnChildAdded.mockImplementation(() => () => {});
    mockOnChildChanged.mockImplementation(() => () => {});
    mockOnChildRemoved.mockImplementation(() => () => {});

    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);

    mockPush.mockImplementation((parentRef: { _path: string }) => ({
      _path: `${parentRef._path}/msg_1`,
      key: 'msg_1',
      toString: () => `${parentRef._path}/msg_1`,
    }));

    mockFetch.mockImplementation(async () => createDirectSendSuccessResponse());
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads direct messages through the secure read endpoint', async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url.includes('/api/direct-messages')) {
        return new Response(
          JSON.stringify({
            messages: [
              {
                id: 'msg_2',
                content: 'second',
                senderId: 'guest_xyz',
                senderRole: 'guest',
                createdAt: 20,
              },
              {
                id: 'msg_1',
                content: 'first',
                senderId: 'guest_abc',
                senderRole: 'guest',
                createdAt: 10,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      return createDirectSendSuccessResponse();
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      result.current.setCurrentChannelId('dm_guest_abc_guest_xyz');
    });

    await waitFor(() => {
      expect(result.current.messages.dm_guest_abc_guest_xyz).toEqual([
        expect.objectContaining({ id: 'msg_1', createdAt: 10 }),
        expect.objectContaining({ id: 'msg_2', createdAt: 20 }),
      ]);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/direct-messages?channelId=dm_guest_abc_guest_xyz&limit=50',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'X-Prime-Guest-Token': 'token_123',
          'X-Prime-Guest-Booking-Id': 'booking123',
        },
        cache: 'no-store',
      }),
    );
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockOnChildAdded).not.toHaveBeenCalled();
    expect(mockOnChildChanged).not.toHaveBeenCalled();
    expect(mockOnChildRemoved).not.toHaveBeenCalled();
  });

  it('clears direct-channel messages when secure read endpoint denies access', async () => {
    let denyDirectReads = false;
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url.includes('/api/direct-messages')) {
        if (denyDirectReads) {
          return new Response(
            JSON.stringify({ error: 'Direct channel access denied for this guest session' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return new Response(
          JSON.stringify({
            messages: [
              {
                id: 'msg_1',
                content: 'hello',
                senderId: 'guest_xyz',
                senderRole: 'guest',
                createdAt: 10,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      return createDirectSendSuccessResponse();
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      result.current.setCurrentChannelId('dm_guest_abc_guest_xyz');
    });

    await waitFor(() => {
      expect(result.current.messages.dm_guest_abc_guest_xyz).toHaveLength(1);
    });

    denyDirectReads = true;

    act(() => {
      result.current.setCurrentChannelId(null);
    });

    act(() => {
      result.current.setCurrentChannelId('dm_guest_abc_guest_xyz');
    });

    await waitFor(() => {
      expect(result.current.messages.dm_guest_abc_guest_xyz).toEqual([]);
    });
  });

  it('loads older direct messages through secure endpoint pagination', async () => {
    let includeOlderInBaseWindow = false;

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url.includes('/api/direct-messages') && url.includes('before=100')) {
        includeOlderInBaseWindow = true;
        return new Response(
          JSON.stringify({
            messages: [
              {
                id: 'msg_0',
                content: 'older',
                senderId: 'guest_xyz',
                senderRole: 'guest',
                createdAt: 50,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (url.includes('/api/direct-messages')) {
        return new Response(
          JSON.stringify({
            messages: includeOlderInBaseWindow
              ? [
                  {
                    id: 'msg_0',
                    content: 'older',
                    senderId: 'guest_xyz',
                    senderRole: 'guest',
                    createdAt: 50,
                  },
                  {
                    id: 'msg_1',
                    content: 'first',
                    senderId: 'guest_abc',
                    senderRole: 'guest',
                    createdAt: 100,
                  },
                  {
                    id: 'msg_2',
                    content: 'second',
                    senderId: 'guest_xyz',
                    senderRole: 'guest',
                    createdAt: 200,
                  },
                ]
              : [
                  {
                    id: 'msg_1',
                    content: 'first',
                    senderId: 'guest_abc',
                    senderRole: 'guest',
                    createdAt: 100,
                  },
                  {
                    id: 'msg_2',
                    content: 'second',
                    senderId: 'guest_xyz',
                    senderRole: 'guest',
                    createdAt: 200,
                  },
                ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return createDirectSendSuccessResponse();
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      result.current.setCurrentChannelId('dm_guest_abc_guest_xyz');
    });

    await waitFor(() => {
      expect(result.current.messages.dm_guest_abc_guest_xyz).toEqual([
        expect.objectContaining({ id: 'msg_1', createdAt: 100 }),
        expect.objectContaining({ id: 'msg_2', createdAt: 200 }),
      ]);
    });

    act(() => {
      void result.current.loadOlderMessages('dm_guest_abc_guest_xyz');
    });

    await waitFor(() => {
      expect(result.current.messages.dm_guest_abc_guest_xyz).toEqual([
        expect.objectContaining({ id: 'msg_0', createdAt: 50 }),
        expect.objectContaining({ id: 'msg_1', createdAt: 100 }),
        expect.objectContaining({ id: 'msg_2', createdAt: 200 }),
      ]);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/direct-messages?channelId=dm_guest_abc_guest_xyz&limit=50&before=100',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'X-Prime-Guest-Token': 'token_123',
            'X-Prime-Guest-Booking-Id': 'booking123',
          },
          cache: 'no-store',
        }),
      );
    });
  });

  it('applies Retry-After backoff for direct older-message reads after 429', async () => {
    let olderReadAttempts = 0;

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);

      if (url.includes('/api/direct-messages') && url.includes('before=100')) {
        olderReadAttempts += 1;
        if (olderReadAttempts === 1) {
          return new Response(
            JSON.stringify({ error: 'Too many direct-message reads. Please wait before retrying.' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '10',
              },
            },
          );
        }
      }

      if (url.includes('/api/direct-messages')) {
        return new Response(
          JSON.stringify({
            messages: [
              {
                id: 'msg_1',
                content: 'first',
                senderId: 'guest_abc',
                senderRole: 'guest',
                createdAt: 100,
              },
              {
                id: 'msg_2',
                content: 'second',
                senderId: 'guest_xyz',
                senderRole: 'guest',
                createdAt: 200,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return createDirectSendSuccessResponse();
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      result.current.setCurrentChannelId('dm_guest_abc_guest_xyz');
    });

    await waitFor(() => {
      expect(result.current.messages.dm_guest_abc_guest_xyz).toEqual([
        expect.objectContaining({ id: 'msg_1', createdAt: 100 }),
        expect.objectContaining({ id: 'msg_2', createdAt: 200 }),
      ]);
    });

    await act(async () => {
      await result.current.loadOlderMessages('dm_guest_abc_guest_xyz');
    });

    await act(async () => {
      await result.current.loadOlderMessages('dm_guest_abc_guest_xyz');
    });

    expect(olderReadAttempts).toBe(1);
  });

  it('routes direct messages through the function endpoint with validated payload', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('dm_guest_abc_guest_xyz', 'hello', {
        directMessage: {
          bookingId: 'booking123',
          peerUuid: 'guest_xyz',
        },
      });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/direct-message',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Prime-Guest-Token': 'token_123',
          'X-Prime-Guest-Booking-Id': 'booking123',
        },
        body: JSON.stringify({
          bookingId: 'booking123',
          peerUuid: 'guest_xyz',
          channelId: 'dm_guest_abc_guest_xyz',
          content: 'hello',
        }),
      }),
    );

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects direct message when provided booking does not match session booking', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await expect(
      result.current.sendMessage('dm_guest_abc_guest_xyz', 'hello', {
        directMessage: {
          bookingId: 'booking999',
          peerUuid: 'guest_xyz',
        },
      }),
    ).rejects.toThrow('Direct message booking mismatch.');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('bubbles function endpoint validation errors for direct messages', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'Direct messaging policy does not allow this conversation' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await expect(
      result.current.sendMessage('dm_guest_abc_guest_xyz', 'hello', {
        directMessage: {
          bookingId: 'booking123',
          peerUuid: 'guest_xyz',
        },
      }),
    ).rejects.toThrow('Direct messaging policy does not allow this conversation');
  });

  it('surfaces generic error when function response is non-json', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 500 }));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await expect(
      result.current.sendMessage('dm_guest_abc_guest_xyz', 'hello', {
        directMessage: {
          bookingId: 'booking123',
          peerUuid: 'guest_xyz',
        },
      }),
    ).rejects.toThrow('Failed to send direct message.');
  });

  it('applies local send cooldown from Retry-After when direct send returns 429', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'Too many direct messages. Please wait before sending more.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '5',
          },
        },
      ),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await expect(
      result.current.sendMessage('dm_guest_abc_guest_xyz', 'hello', {
        directMessage: {
          bookingId: 'booking123',
          peerUuid: 'guest_xyz',
        },
      }),
    ).rejects.toThrow(/^Too many direct messages\. Try again in \d+s\.$/);

    await expect(
      result.current.sendMessage('dm_guest_abc_guest_xyz', 'hello again', {
        directMessage: {
          bookingId: 'booking123',
          peerUuid: 'guest_xyz',
        },
      }),
    ).rejects.toThrow(/^Too many direct messages\. Try again in \d+s\.$/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
