'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Users } from 'lucide-react';

import { useChat } from '@/contexts/messaging/ChatProvider';
import { useGuestProfiles } from '@/hooks/data/useGuestProfiles';
import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import { buildDirectMessageChannelId } from '@/lib/chat/directMessageChannel';
import { canSendDirectMessage } from '@/lib/chat/messagingPolicy';
import { get, ref } from '@/services/firebase';
import { useFirebaseDatabase } from '@/services/useFirebase';
import type { ActivityInstance } from '@/types/messenger/activity';
import { MSG_ROOT } from '@/utils/messaging/dbRoot';

type ActivityLifecycle = 'upcoming' | 'live' | 'ended';
type ChannelMode = 'activity' | 'direct';

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
  const modeParam = searchParams.get('mode');
  const rawChannelId = searchParams.get('id');
  const peerUuid = searchParams.get('peer');
  const channelMode: ChannelMode = modeParam === 'direct' ? 'direct' : 'activity';
  const db = useFirebaseDatabase();
  const { messages, activities, setCurrentChannelId, sendMessage } = useChat();
  const { profiles, isLoading: isProfilesLoading } = useGuestProfiles();

  const session = readGuestSession();
  const currentGuestUuid = session.uuid;
  const currentBookingId = session.bookingId;

  const channelId = useMemo(() => {
    if (channelMode === 'activity') {
      return rawChannelId;
    }

    if (!currentGuestUuid || !peerUuid || currentGuestUuid === peerUuid) {
      return null;
    }

    const expectedId = buildDirectMessageChannelId(currentGuestUuid, peerUuid);
    if (rawChannelId && rawChannelId !== expectedId) {
      return expectedId;
    }

    return expectedId;
  }, [channelMode, currentGuestUuid, peerUuid, rawChannelId]);

  const currentProfile = currentGuestUuid ? profiles[currentGuestUuid] : null;
  const peerProfile = peerUuid ? profiles[peerUuid] : null;

  const isDirectConversationAllowed = useMemo(() => {
    if (channelMode !== 'direct') {
      return true;
    }

    if (
      !currentGuestUuid
      || !peerUuid
      || currentGuestUuid === peerUuid
      || !currentBookingId
      || !currentProfile
      || !peerProfile
    ) {
      return false;
    }

    if (
      currentProfile.bookingId !== currentBookingId
      || peerProfile.bookingId !== currentBookingId
    ) {
      return false;
    }

    return canSendDirectMessage(currentProfile, currentGuestUuid, peerProfile, peerUuid);
  }, [channelMode, currentBookingId, currentGuestUuid, currentProfile, peerProfile, peerUuid]);

  const [isPresent, setIsPresent] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activity = channelId ? activities[channelId] : undefined;
  const channelMessages = useMemo(() => channelId ? messages[channelId] ?? [] : [], [channelId, messages]);
  const lifecycle =
    channelMode === 'direct'
      ? 'live'
      : activity
        ? resolveLifecycle(activity, Date.now())
        : 'upcoming';
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
    if (channelMode === 'direct') {
      setIsPresent(true);
      return;
    }

    if (!channelId || !currentGuestUuid) return;

    const checkPresence = async () => {
      try {
        const presenceRef = ref(db, `${MSG_ROOT}/activities/presence/${channelId}/${currentGuestUuid}`);
        const snap = await get(presenceRef);
        setIsPresent(snap.exists());
      } catch (err) {
        console.error('Failed to check presence:', err);
      }
    };

    checkPresence();
  }, [channelId, channelMode, currentGuestUuid, db]);

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

  if (channelMode === 'direct' && isProfilesLoading) {
    return (
      <main className="min-h-dvh bg-muted p-4">
        <div className="mx-auto w-full text-center">
          <p className="text-muted-foreground">{t('loadingDirectChannel', 'Loading chat...')}</p>
        </div>
      </main>
    );
  }

  if (!channelId) {
    return (
      <main className="min-h-dvh bg-muted p-4">
        <div className="mx-auto w-full text-center">
          <p className="text-muted-foreground">{t('noChannelSelected', 'No channel selected')}</p>
          <Link href={channelMode === 'direct' ? '/chat' : '/activities'} className="text-primary hover:underline">
            {channelMode === 'direct'
              ? t('backToChat', 'Back to Chat')
              : t('backToActivities', 'Back to Activities')}
          </Link>
        </div>
      </main>
    );
  }

  if (channelMode === 'activity' && !activity) {
    return (
      <main className="min-h-dvh bg-muted p-4">
        <div className="mx-auto w-full text-center">
          <p className="text-muted-foreground">{t('loadingActivity', 'Loading activity...')}</p>
        </div>
      </main>
    );
  }

  if (channelMode === 'direct' && !isDirectConversationAllowed) {
    return (
      <main className="min-h-dvh bg-muted p-4">
        <div className="mx-auto w-full space-y-3 rounded-lg border border-border bg-card p-5 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            {t('directMessagingUnavailable', 'Direct messaging is unavailable for this guest.')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              'directMessagingUnavailableDescription',
              'Both guests must be confirmed on the same stay, opt into chat, and not be blocked.',
            )}
          </p>
          <Link href="/chat" className="inline-block text-sm font-medium text-primary hover:underline">
            {t('backToChat', 'Back to Chat')}
          </Link>
        </div>
      </main>
    );
  }

  const headerTitle =
    channelMode === 'direct'
      ? t('chat.directory.guestLabel', { id: peerUuid?.substring(0, 8) ?? '...' })
      : activity?.title || t('channelTitle', 'Activity Chat');

  const statusLabel =
    channelMode === 'direct'
      ? t('statusDirect', 'Direct chat')
      : isLive
        ? t('statusLive', 'Live now')
        : t('statusUpcoming', 'Starts soon');

  return (
    <main className="flex min-h-dvh flex-col bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="mx-auto flex w-full items-center gap-3">
          <Link
            href={channelMode === 'direct' ? '/chat' : '/activities'}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">{headerTitle}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full space-y-3">
          {channelMode === 'activity' && !isLive && (
            <div className="rounded-lg bg-warning-soft border border-warning p-4 text-center">
              <p className="text-sm text-warning-foreground">
                {t('availableWhenLive', 'Chat will be available when the activity starts')}
              </p>
            </div>
          )}

          {channelMessages.map((msg) => {
            const isOwn = msg.senderId === currentGuestUuid;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : msg.senderRole === 'system'
                        ? 'bg-muted text-muted-foreground italic'
                        : 'bg-card border border-border text-foreground'
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
                      isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'
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
        <div className="border-t border-border bg-card px-4 py-3">
          <div className="mx-auto w-full">
            {channelMode === 'activity' && !isPresent ? (
              <div className="rounded-lg bg-info-soft border border-primary/30 p-4 text-center">
                <p className="text-sm text-primary">
                  {t(
                    'markPresenceToChat',
                    'Mark your presence on the activity page to start chatting',
                  )}
                </p>
                <Link
                  href="/activities"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary"
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
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="flex min-h-11 min-w-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
