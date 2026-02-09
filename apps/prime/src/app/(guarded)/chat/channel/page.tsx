'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Users } from 'lucide-react';

import { useChat } from '@/contexts/messaging/ChatProvider';
import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import { get, ref } from '@/services/firebase';
import { useFirebaseDatabase } from '@/services/useFirebase';
import type { ActivityInstance } from '@/types/messenger/activity';
import { MSG_ROOT } from '@/utils/messaging/dbRoot';

type ActivityLifecycle = 'upcoming' | 'live' | 'ended';

function resolveLifecycle(activity: ActivityInstance, now: number): ActivityLifecycle {
  const start = activity.startTime;
  const end = start + 2 * 60 * 60 * 1000;
  if (now >= end || activity.status === 'archived') {
    return 'ended';
  }
  if (now >= start || activity.status === 'live') {
    return 'live';
  }
  return 'upcoming';
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export default function ChannelPage() {
  const { t } = useTranslation('Chat');
  const searchParams = useSearchParams();
  const channelId = searchParams.get('id');
  const db = useFirebaseDatabase();
  const { messages, activities, setCurrentChannelId, sendMessage } = useChat();

  const [isPresent, setIsPresent] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activity = channelId ? activities[channelId] : undefined;
  const channelMessages = useMemo(() => channelId ? messages[channelId] ?? [] : [], [channelId, messages]);
  const lifecycle = activity ? resolveLifecycle(activity, Date.now()) : 'upcoming';
  const isLive = lifecycle === 'live';

  // Set current channel on mount
  useEffect(() => {
    if (channelId) {
      setCurrentChannelId(channelId);
    }
    return () => {
      setCurrentChannelId(null);
    };
  }, [channelId, setCurrentChannelId]);

  // Check presence
  useEffect(() => {
    if (!channelId) return;

    const session = readGuestSession();
    if (!session.uuid) return;

    const checkPresence = async () => {
      try {
        const presenceRef = ref(db, `${MSG_ROOT}/activities/presence/${channelId}/${session.uuid}`);
        const snap = await get(presenceRef);
        setIsPresent(snap.exists());
      } catch (err) {
        console.error('Failed to check presence:', err);
      }
    };

    checkPresence();
  }, [channelId, db]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();

    if (!channelId || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(channelId, messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!channelId) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md text-center">
          <p className="text-gray-600">{t('noChannelSelected', 'No channel selected')}</p>
          <Link href="/activities" className="text-blue-600 hover:underline">
            {t('backToActivities', 'Back to Activities')}
          </Link>
        </div>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md text-center">
          <p className="text-gray-600">{t('loadingActivity', 'Loading activity...')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/activities" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">
              {activity.title || t('channelTitle', 'Activity Chat')}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>
                {isLive
                  ? t('statusLive', 'Live now')
                  : t('statusUpcoming', 'Starts soon')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {!isLive && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
              <p className="text-sm text-yellow-800">
                {t('availableWhenLive', 'Chat will be available when the activity starts')}
              </p>
            </div>
          )}

          {channelMessages.map((msg) => {
            const isOwn = msg.senderId === readGuestSession().uuid;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : msg.senderRole === 'system'
                        ? 'bg-gray-100 text-gray-700 italic'
                        : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {!isOwn && msg.senderRole !== 'system' && (
                    <div className="mb-1 text-xs font-medium opacity-75">
                      {msg.senderName || t('anonymousGuest', 'Guest')}
                    </div>
                  )}
                  <div className="text-sm">{msg.content}</div>
                  <div
                    className={`mt-1 text-xs ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      {isLive && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto max-w-2xl">
            {!isPresent ? (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                <p className="text-sm text-blue-800">
                  {t(
                    'markPresenceToChat',
                    'Mark your presence on the activity page to start chatting',
                  )}
                </p>
                <Link
                  href="/activities"
                  className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {t('goToActivities', 'Go to Activities')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={t('typeMessage', 'Type a message...')}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('send', 'Send')}
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('send', 'Send')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
