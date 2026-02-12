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
  sendMessage: (channelId: string, content: string) => Promise<void>;
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

    const q = query(
      ref(db, `${MSG_ROOT}/channels/${currentChannelId}/messages`),
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
        channelId: currentChannelId!,
        messages,
      });
    });

    const handleAdd = (snap: DataSnapshot) => {
      const msg = snap.val();
      if (!msg) return;
      const message: Message = { id: snap.key as string, ...msg };
      dispatch({
        type: 'upsertMessage',
        channelId: currentChannelId!,
        message,
      });
    };
    const handleChange = (snap: DataSnapshot) => {
      const msg = snap.val();
      if (!msg) return;
      const message: Message = { id: snap.key as string, ...msg };
      dispatch({
        type: 'upsertMessage',
        channelId: currentChannelId!,
        message,
      });
    };
    const handleRemove = (snap: DataSnapshot) => {
      dispatch({
        type: 'removeMessage',
        channelId: currentChannelId!,
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
    async (channelId: string, content: string) => {
      if (!content.trim()) return;

      // Get guest session info
      const { readGuestSession: readSession } = await import('@/lib/auth/guestSessionGuard');
      const session = readSession();

      if (!session.uuid) {
        throw new Error('Guest session not found');
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
