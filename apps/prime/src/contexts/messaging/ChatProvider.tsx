'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { push } from 'firebase/database';

import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import {
  buildDirectMessageChannelId,
  directMessageChannelIncludesGuest,
  isDirectMessageChannelId,
} from '@/lib/chat/directMessageChannel';
import { MSG_ROOT } from '@/utils/messaging/dbRoot';

import {
  type DataSnapshot,
  endAt,
  endBefore,
  equalTo,
  get,
  limitToFirst,
  limitToLast,
  off,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  orderByChild,
  query,
  ref,
  set,
  startAt,
  update,
} from '../../services/firebase';
import { useFirebaseDatabase } from '../../services/useFirebase';
import type { ActivityInstance } from '../../types/messenger/activity';
import type { Message } from '../../types/messenger/chat';

const PAGE_SIZE = 50;
const ACTIVITIES_PAGE_SIZE = 20;
const DIRECT_MESSAGES_POLL_INTERVAL_MS = 3_000;
const DIRECT_MESSAGES_RETRY_FALLBACK_MS = 10_000;

interface ChatState {
  activities: Record<string, ActivityInstance>;
  messages: Record<string, Message[]>;
}

interface ChatContextValue extends ChatState {
  currentChannelId: string | null;
  setCurrentChannelId: (id: string | null) => void;
  loadOlderMessages: (channelId: string) => Promise<void>;
  loadMoreActivities: () => void;
  hasMoreActivities: boolean;
  sendMessage: (
    channelId: string,
    content: string,
    options?: SendMessageOptions,
  ) => Promise<void>;
}

interface DirectMessageContext {
  bookingId: string;
  peerUuid: string;
}

interface SendMessageOptions {
  directMessage?: DirectMessageContext;
}

interface DirectMessagesApiResponse {
  messages?: unknown;
}

function buildDirectMessagesRequestUrl(
  channelId: string,
  options?: {
    before?: number;
    limit?: number;
  },
): string {
  const params = new URLSearchParams();
  params.set('channelId', channelId);
  params.set('limit', String(options?.limit ?? PAGE_SIZE));

  if (typeof options?.before === 'number') {
    params.set('before', String(options.before));
  }

  return `/api/direct-messages?${params.toString()}`;
}

function parseRetryAfterMs(headers: Headers, fallbackMs: number): number {
  const retryAfter = headers.get('Retry-After')?.trim() ?? '';
  if (!retryAfter) {
    return fallbackMs;
  }

  const retryAfterSeconds = Number.parseInt(retryAfter, 10);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  const retryAfterTimestamp = Date.parse(retryAfter);
  if (Number.isFinite(retryAfterTimestamp)) {
    return Math.max(1_000, retryAfterTimestamp - Date.now());
  }

  return fallbackMs;
}

function buildDirectRateLimitMessage(retryAfterMs: number): string {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `Too many direct messages. Try again in ${seconds}s.`;
}

type ChatAction =
  | { type: 'setActivities'; activities: Record<string, ActivityInstance> }
  | { type: 'setMessages'; channelId: string; messages: Message[] }
  | { type: 'prependMessages'; channelId: string; messages: Message[] }
  | { type: 'upsertMessage'; channelId: string; message: Message }
  | { type: 'removeMessage'; channelId: string; id: string };

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'setActivities':
      return { ...state, activities: action.activities };
    case 'setMessages':
      return {
        ...state,
        messages: { ...state.messages, [action.channelId]: action.messages },
      };
    case 'prependMessages':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.channelId]: [
            ...action.messages,
            ...(state.messages[action.channelId] ?? []),
          ],
        },
      };
    case 'upsertMessage': {
      const current = state.messages[action.channelId] ?? [];
      const idx = current.findIndex((m) => m.id === action.message.id);
      let updated: Message[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = action.message;
      } else {
        updated = [...current, action.message];
        updated.sort((a, b) => a.createdAt - b.createdAt);
        if (updated.length > PAGE_SIZE) {
          updated = updated.slice(updated.length - PAGE_SIZE);
        }
      }
      return {
        ...state,
        messages: { ...state.messages, [action.channelId]: updated },
      };
    }
    case 'removeMessage': {
      const current = state.messages[action.channelId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.channelId]: current.filter((m) => m.id !== action.id),
        },
      };
    }
    default:
      return state;
  }
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Message>;
  if (
    typeof candidate.id !== 'string'
    || typeof candidate.content !== 'string'
    || typeof candidate.senderId !== 'string'
    || typeof candidate.senderRole !== 'string'
    || typeof candidate.createdAt !== 'number'
  ) {
    return false;
  }

  if (candidate.senderName !== undefined && typeof candidate.senderName !== 'string') {
    return false;
  }
  if (candidate.deleted !== undefined && typeof candidate.deleted !== 'boolean') {
    return false;
  }
  if (candidate.imageUrl !== undefined && typeof candidate.imageUrl !== 'string') {
    return false;
  }

  return true;
}

function normalizeDirectMessages(payload: unknown): Message[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const rawMessages = (payload as DirectMessagesApiResponse).messages;
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .filter(isMessage)
    .sort((left, right) => left.createdAt - right.createdAt);
}

const initialState: ChatState = { activities: {}, messages: {} };

export const ChatContext = createContext<ChatContextValue | undefined>(
  undefined,
);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const db = useFirebaseDatabase();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [activitiesLimit, setActivitiesLimit] = useState(ACTIVITIES_PAGE_SIZE);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  const prevStatusRef = useRef<Record<string, ActivityInstance['status']>>({});
  const directReadBackoffUntilRef = useRef<Record<string, number>>({});
  const directWriteBackoffUntilRef = useRef<number>(0);

  const removeSystemMessages = useCallback(
    async (instanceId: string) => {
      try {
        const q = query(
          ref(db, `${MSG_ROOT}/channels/${instanceId}/messages`),
          orderByChild('senderRole'),
          equalTo('system'),
        );
        const snap = await get(q);
        const raw = (snap.val() ?? {}) as Record<string, unknown>;
        const updates: Record<string, null> = {};
        Object.keys(raw).forEach((mid) => {
          updates[`${MSG_ROOT}/channels/${instanceId}/messages/${mid}`] = null;
        });
        if (Object.keys(updates).length) {
          await update(ref(db), updates);
        }
      } catch (err) {
        console.error('Failed to remove system messages', err);
      }
    },
    [db],
  );

  const postInitialMessages = useCallback(
    async (instanceId: string, templateId: string) => {
      try {
        const snap = await get(
          ref(
            db,
            `${MSG_ROOT}/activities/templates/${templateId}/initialMessages`,
          ),
        );
        const initial: string[] = snap.val() ?? [];
        const baseRef = ref(db, `${MSG_ROOT}/channels/${instanceId}/messages`);
        await Promise.all(
          initial.map((content) =>
            set(push(baseRef), {
              content,
              senderId: 'system',
              senderRole: 'system',
              createdAt: Date.now(),
            }),
          ),
        );
      } catch (err) {
        console.error('Failed to post initial messages', err);
      }
    },
    [db],
  );

  useEffect(() => {
    // OPT-04: Paginate activities query to prevent downloading all records
    const q = query(
      ref(db, `${MSG_ROOT}/activities/instances`),
      orderByChild('status'),
      startAt('live'),
      endAt('upcoming'),
      limitToFirst(activitiesLimit),
    );

    const unsubValue = onValue(q, (snap) => {
      const raw = (snap.val() ?? {}) as Record<string, ActivityInstance>;
      const entries = Object.entries(raw)
        .filter(([, a]) => ['live', 'upcoming'].includes((a as ActivityInstance).status))
        .map(([id, a]) => [id, { ...a, id }] as const);

      const filtered = Object.fromEntries(entries) as Record<string, ActivityInstance>;

      // Track whether there might be more activities beyond the current limit
      setHasMoreActivities(entries.length >= activitiesLimit);

      const prev = prevStatusRef.current;
      Object.entries(filtered).forEach(([id, act]) => {
        if (act.status === 'live' && prev[id] !== 'live') {
          postInitialMessages(id, act.templateId);
        }
      });
      Object.entries(prev).forEach(([id, status]) => {
        if (status === 'live' && !filtered[id]) {
          removeSystemMessages(id);
        }
      });
      prevStatusRef.current = Object.fromEntries(
        Object.entries(filtered).map(([id, act]) => [id, act.status]),
      );

      dispatch({ type: 'setActivities', activities: filtered });
    });
    return () => {
      off(q);
      unsubValue();
    };
  }, [db, activitiesLimit, postInitialMessages, removeSystemMessages]);

  const loadMoreActivities = useCallback(() => {
    setActivitiesLimit((prev) => prev + ACTIVITIES_PAGE_SIZE);
  }, []);

  const messageListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!db) return;

    messageListenerRef.current?.();
    messageListenerRef.current = null;
    if (!currentChannelId) return;

    const activeChannelId = currentChannelId;

    if (isDirectMessageChannelId(activeChannelId)) {
      const session = readGuestSession();
      if (
        !session.uuid
        || !session.token
        || !session.bookingId
        || !directMessageChannelIncludesGuest(activeChannelId, session.uuid)
      ) {
        dispatch({ type: 'setMessages', channelId: activeChannelId, messages: [] });
        return;
      }

      let cancelled = false;

      const pollDirectMessages = async () => {
        const backoffUntil = directReadBackoffUntilRef.current[activeChannelId] ?? 0;
        if (Date.now() < backoffUntil) {
          return;
        }

        try {
          const response = await fetch(
            buildDirectMessagesRequestUrl(activeChannelId, { limit: PAGE_SIZE }),
            {
              method: 'GET',
              headers: {
                'X-Prime-Guest-Token': session.token,
                'X-Prime-Guest-Booking-Id': session.bookingId,
              },
              cache: 'no-store',
            },
          );

          if (!response.ok) {
            if (response.status === 429) {
              const retryMs = parseRetryAfterMs(
                response.headers,
                DIRECT_MESSAGES_RETRY_FALLBACK_MS,
              );
              directReadBackoffUntilRef.current[activeChannelId] = Date.now() + retryMs;
              return;
            }

            if (!cancelled && (response.status === 403 || response.status === 404)) {
              dispatch({
                type: 'setMessages',
                channelId: activeChannelId,
                messages: [],
              });
            }
            return;
          }

          const payload = await response.json();
          if (cancelled) {
            return;
          }
          directReadBackoffUntilRef.current[activeChannelId] = 0;

          dispatch({
            type: 'setMessages',
            channelId: activeChannelId,
            messages: normalizeDirectMessages(payload),
          });
        } catch (error) {
          console.error('Failed to load direct messages', error);
        }
      };

      void pollDirectMessages();
      const intervalId = window.setInterval(() => {
        void pollDirectMessages();
      }, DIRECT_MESSAGES_POLL_INTERVAL_MS);

      messageListenerRef.current = () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };

      return () => {
        messageListenerRef.current?.();
        messageListenerRef.current = null;
      };
    }

    const q = query(
      ref(db, `${MSG_ROOT}/channels/${activeChannelId}/messages`),
      orderByChild('createdAt'),
      limitToLast(PAGE_SIZE),
    );
    get(q).then((snap) => {
      const raw = snap.val() ?? {};
      const messages: Message[] = Object.entries(raw).map(
        ([mid, msg]: [string, unknown]) => ({ id: mid, ...(msg as Omit<Message, 'id'>) }),
      );
      dispatch({
        type: 'setMessages',
        channelId: activeChannelId,
        messages,
      });
    });

    const handleAdd = (snap: DataSnapshot) => {
      const msg = snap.val();
      if (!msg) return;
      const message: Message = { id: snap.key as string, ...msg };
      dispatch({
        type: 'upsertMessage',
        channelId: activeChannelId,
        message,
      });
    };
    const handleChange = (snap: DataSnapshot) => {
      const msg = snap.val();
      if (!msg) return;
      const message: Message = { id: snap.key as string, ...msg };
      dispatch({
        type: 'upsertMessage',
        channelId: activeChannelId,
        message,
      });
    };
    const handleRemove = (snap: DataSnapshot) => {
      dispatch({
        type: 'removeMessage',
        channelId: activeChannelId,
        id: snap.key as string,
      });
    };

    const unsubAdd = onChildAdded(q, handleAdd);
    const unsubChange = onChildChanged(q, handleChange);
    const unsubRemove = onChildRemoved(q, handleRemove);

    messageListenerRef.current = () => {
      off(q, 'child_added', handleAdd);
      off(q, 'child_changed', handleChange);
      off(q, 'child_removed', handleRemove);
      off(q);
      unsubAdd();
      unsubChange();
      unsubRemove();
    };

    return () => {
      messageListenerRef.current?.();
      messageListenerRef.current = null;
    };
  }, [db, currentChannelId]);

  const loadOlderMessages = useCallback(
    async (channelId: string) => {
      if (isDirectMessageChannelId(channelId)) {
        const session = readGuestSession();
        if (
          !session.uuid
          || !session.token
          || !session.bookingId
          || !directMessageChannelIncludesGuest(channelId, session.uuid)
        ) {
          dispatch({ type: 'setMessages', channelId, messages: [] });
          return;
        }

        const current = state.messages[channelId] ?? [];
        const oldest = current[0];
        if (!oldest) return;

        const backoffUntil = directReadBackoffUntilRef.current[channelId] ?? 0;
        if (Date.now() < backoffUntil) {
          return;
        }

        try {
          const response = await fetch(
            buildDirectMessagesRequestUrl(channelId, {
              before: oldest.createdAt,
              limit: PAGE_SIZE,
            }),
            {
              method: 'GET',
              headers: {
                'X-Prime-Guest-Token': session.token,
                'X-Prime-Guest-Booking-Id': session.bookingId,
              },
              cache: 'no-store',
            },
          );

          if (!response.ok) {
            if (response.status === 429) {
              const retryMs = parseRetryAfterMs(
                response.headers,
                DIRECT_MESSAGES_RETRY_FALLBACK_MS,
              );
              directReadBackoffUntilRef.current[channelId] = Date.now() + retryMs;
              return;
            }
            if (response.status === 403 || response.status === 404) {
              dispatch({ type: 'setMessages', channelId, messages: [] });
            }
            return;
          }

          const payload = await response.json();
          directReadBackoffUntilRef.current[channelId] = 0;
          const messages = normalizeDirectMessages(payload);
          if (messages.length) {
            dispatch({ type: 'prependMessages', channelId, messages });
          }
        } catch (error) {
          console.error('Failed to load older direct messages', error);
        }

        return;
      }
      const current = state.messages[channelId] ?? [];
      const oldest = current[0];
      if (!oldest) return;
      const q = query(
        ref(db, `${MSG_ROOT}/channels/${channelId}/messages`),
        orderByChild('createdAt'),
        endBefore(oldest.createdAt),
        limitToLast(PAGE_SIZE),
      );
      const snap = await get(q);
      const raw = snap.val() ?? {};
      const messages: Message[] = Object.entries(raw).map(
        ([mid, msg]: [string, unknown]) => ({ id: mid, ...(msg as Omit<Message, 'id'>) }),
      );
      if (messages.length) {
        dispatch({ type: 'prependMessages', channelId, messages });
      }
    },
    [db, state.messages],
  );

  const sendMessage = useCallback(
    async (channelId: string, content: string, options?: SendMessageOptions) => {
      if (!content.trim()) return;

      // Get guest session info
      const session = readGuestSession();

      if (!session.uuid) {
        throw new Error('Guest session not found');
      }

      if (options?.directMessage) {
        const { bookingId, peerUuid } = options.directMessage;

        if (!bookingId || !peerUuid || !session.bookingId || !session.token) {
          throw new Error('Direct message context is incomplete.');
        }

        if (session.bookingId !== bookingId) {
          throw new Error('Direct message booking mismatch.');
        }

        if (session.uuid === peerUuid) {
          throw new Error('Cannot send a direct message to the same guest UUID.');
        }

        const expectedChannelId = buildDirectMessageChannelId(session.uuid, peerUuid);
        if (channelId !== expectedChannelId) {
          throw new Error('Direct message channel does not match participant UUIDs.');
        }

        const activeWriteBackoff = directWriteBackoffUntilRef.current - Date.now();
        if (activeWriteBackoff > 0) {
          throw new Error(buildDirectRateLimitMessage(activeWriteBackoff));
        }

        const directResponse = await fetch('/api/direct-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Prime-Guest-Token': session.token,
            'X-Prime-Guest-Booking-Id': bookingId,
          },
          body: JSON.stringify({
            bookingId,
            peerUuid,
            channelId,
            content: content.trim(),
          }),
        });

        if (!directResponse.ok) {
          if (directResponse.status === 429) {
            const retryMs = parseRetryAfterMs(
              directResponse.headers,
              DIRECT_MESSAGES_RETRY_FALLBACK_MS,
            );
            directWriteBackoffUntilRef.current = Date.now() + retryMs;
            throw new Error(buildDirectRateLimitMessage(retryMs));
          }

          let errorMessage = 'Failed to send direct message.';
          try {
            const payload = await directResponse.json() as { error?: string };
            if (typeof payload.error === 'string' && payload.error.trim()) {
              errorMessage = payload.error;
            }
          } catch {
            // Keep default message for non-JSON or empty responses.
          }
          throw new Error(errorMessage);
        }

        directWriteBackoffUntilRef.current = 0;
        return;
      }

      const messageRef = push(ref(db, `${MSG_ROOT}/channels/${channelId}/messages`));
      const message: Omit<Message, 'id'> = {
        content: content.trim(),
        senderId: session.uuid,
        senderRole: 'guest',
        senderName: session.firstName ?? undefined,
        createdAt: Date.now(),
      };

      await set(messageRef, message);
    },
    [db],
  );

  const value: ChatContextValue = {
    ...state,
    currentChannelId,
    setCurrentChannelId,
    loadOlderMessages,
    loadMoreActivities,
    hasMoreActivities,
    sendMessage,
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within <ChatProvider>.');
  }
  return ctx;
}
