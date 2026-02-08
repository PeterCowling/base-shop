/**
 * Channel Page Tests (TASK-45)
 *
 * TC-01: Live + present guest can send message and sees optimistic append
 * TC-02: Live but not-present guest is prompted to mark presence before sending
 * TC-03: Upcoming activity channel is read-only
 */

import { useSearchParams } from 'next/navigation';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { readGuestSession } from '@/lib/auth/guestSessionGuard';

import ChannelPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

const mockReadGuestSession = jest.fn();

jest.mock('@/lib/auth/guestSessionGuard', () => ({
  readGuestSession: () => mockReadGuestSession(),
}));

jest.mock('@/contexts/messaging/ChatProvider', () => ({
  useChat: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const mockOnValue = jest.fn();
const mockOff = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockPush = jest.fn();
const mockRef = jest.fn();

jest.mock('@/services/firebase', () => ({
  db: { id: 'db' },
  firebaseApp: { name: '[DEFAULT]' },
  storage: { id: 'storage' },
  get: (...args: unknown[]) => mockGet(...args),
  off: (...args: unknown[]) => mockOff(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  set: (...args: unknown[]) => mockSet(...args),
  push: (...args: unknown[]) => mockPush(...args),
  ref: (...args: unknown[]) => mockRef(...args),
}));

jest.mock('@/services/useFirebase', () => ({
  useFirebaseDatabase: jest.fn(() => ({ id: 'db' })),
}));

const { useChat } = require('@/contexts/messaging/ChatProvider');

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

describe('Channel Page (TASK-45)', () => {
  const mockChannelId = 'act_test123';
  const mockGuestId = 'guest_abc';

  beforeEach(() => {
    jest.clearAllMocks();

    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => (param === 'id' ? mockChannelId : null),
    });

    mockReadGuestSession.mockReturnValue({
      uuid: mockGuestId,
      firstName: 'Test Guest',
      token: 'token123',
      bookingId: 'booking123',
      verifiedAt: null,
    });

    mockRef.mockImplementation((_db: unknown, path: string) => ({
      toString: () => path,
      _path: path,
    }));

    mockPush.mockReturnValue({
      key: 'msg_new123',
      toString: () => 'messaging/channels/act_test123/messages/msg_new123',
    });

    mockSet.mockResolvedValue(undefined);
    mockGet.mockResolvedValue(createMockSnapshot(null));
    mockOnValue.mockReturnValue(() => {});
  });

  describe('TC-01: Live + present guest can send message', () => {
    it('should show composer and allow sending when guest is present and activity is live', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          content: 'Hello world',
          senderId: 'guest_xyz',
          senderRole: 'guest' as const,
          senderName: 'Other Guest',
          createdAt: Date.now() - 5000,
        },
      ];

      const mockActivity = {
        id: mockChannelId,
        templateId: 'tpl_123',
        status: 'live' as const,
        startTime: Date.now() - 10 * 60 * 1000, // 10 mins ago
        title: 'Test Activity',
      };

      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockSetCurrentChannelId = jest.fn();

      (useChat as jest.Mock).mockReturnValue({
        messages: { [mockChannelId]: mockMessages },
        activities: { [mockChannelId]: mockActivity },
        currentChannelId: mockChannelId,
        setCurrentChannelId: mockSetCurrentChannelId,
        loadOlderMessages: jest.fn(),
        loadMoreActivities: jest.fn(),
        hasMoreActivities: false,
        sendMessage: mockSendMessage,
      });

      // Mock presence check
      mockGet.mockResolvedValue(
        createMockSnapshot({ at: Date.now() }),
      );

      const user = userEvent.setup();
      render(<ChannelPage />);

      // Wait for presence check and initial render
      await waitFor(() => {
        expect(screen.getByText('Hello world')).toBeInTheDocument();
      });

      // Verify setCurrentChannelId was called
      expect(mockSetCurrentChannelId).toHaveBeenCalledWith(mockChannelId);

      // Wait for composer to appear (presence check completes)
      const input = await screen.findByPlaceholderText(/type.*message/i);
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();

      // Type and send message
      await user.type(input, 'Test message');
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Should call sendMessage
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          mockChannelId,
          'Test message',
        );
      });

      // Input should be cleared
      expect(input).toHaveValue('');
    });
  });

  describe('TC-02: Not-present guest is prompted to mark presence', () => {
    it('should disable composer and show prompt when guest is not present', async () => {
      const mockActivity = {
        id: mockChannelId,
        templateId: 'tpl_123',
        status: 'live' as const,
        startTime: Date.now() - 10 * 60 * 1000,
        title: 'Test Activity',
      };

      (useChat as jest.Mock).mockReturnValue({
        messages: { [mockChannelId]: [] },
        activities: { [mockChannelId]: mockActivity },
        currentChannelId: mockChannelId,
        setCurrentChannelId: jest.fn(),
        loadOlderMessages: jest.fn(),
        loadMoreActivities: jest.fn(),
        hasMoreActivities: false,
        sendMessage: jest.fn(),
      });

      // Mock no presence
      mockGet.mockResolvedValue(createMockSnapshot(null));

      render(<ChannelPage />);

      // Wait for presence check
      await waitFor(() => {
        expect(screen.getByText(/mark.*presence/i)).toBeInTheDocument();
      });

      // Composer should be hidden (no input field)
      const input = screen.queryByPlaceholderText(/type.*message/i);
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('TC-03: Upcoming activity channel is read-only', () => {
    it('should show read-only state for upcoming activities', async () => {
      const mockActivity = {
        id: mockChannelId,
        templateId: 'tpl_123',
        status: 'upcoming' as const,
        startTime: Date.now() + 60 * 60 * 1000, // 1 hour from now
        title: 'Future Activity',
      };

      (useChat as jest.Mock).mockReturnValue({
        messages: { [mockChannelId]: [] },
        activities: { [mockChannelId]: mockActivity },
        currentChannelId: mockChannelId,
        setCurrentChannelId: jest.fn(),
        loadOlderMessages: jest.fn(),
        loadMoreActivities: jest.fn(),
        hasMoreActivities: false,
        sendMessage: jest.fn(),
      });

      render(<ChannelPage />);

      // Wait for render
      await waitFor(() => {
        expect(screen.getByText(/available.*activity.*starts/i)).toBeInTheDocument();
      });

      // Should not show composer
      expect(screen.queryByPlaceholderText(/type.*message/i)).not.toBeInTheDocument();
    });
  });
});
