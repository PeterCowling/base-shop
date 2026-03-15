'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Users } from 'lucide-react';

import { Grid, Inline } from '@acme/design-system/primitives';

import { useChat } from '@/contexts/messaging/ChatProvider';
import { useGuestProfiles } from '@/hooks/data/useGuestProfiles';
import { readGuestSession } from '@/lib/auth/guestSessionGuard';
import { buildDirectMessageChannelId, WHOLE_HOSTEL_BROADCAST_CHANNEL_ID } from '@/lib/chat/directMessageChannel';
import { canSendDirectMessage } from '@/lib/chat/messagingPolicy';
import { get, ref } from '@/services/firebase';
import { useFirebaseDatabase } from '@/services/useFirebase';
import type { ActivityInstance } from '@/types/messenger/activity';
import { MSG_ROOT } from '@/utils/messaging/dbRoot';

type ActivityLifecycle = 'upcoming' | 'live' | 'ended';
type ChannelMode = 'activity' | 'broadcast' | 'direct';

function formatAudienceLabel(audience: string): string {
  switch (audience) {
    case 'booking':
      return 'Booking';
    case 'room':
      return 'Room';
    case 'whole_hostel':
      return 'Whole hostel';
    default:
      return 'Thread';
  }
}

function formatDraftStatusLabel(status: string): string {
  switch (status) {
    case 'under_review':
      return 'Under review';
    default:
      return status.replace(/_/g, ' ');
  }
}

function resolveLifecycle(activity: ActivityInstance, now: number): ActivityLifecycle {
  const start = activity.startTime;
  // Math.max(1, ...) guards against durationMinutes: 0 causing immediate-end
  const end = start + Math.max(1, activity.durationMinutes ?? 120) * 60 * 1000;
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
  const channelMode: ChannelMode =
    modeParam === 'direct'
      ? 'direct'
      : modeParam === 'broadcast'
        ? 'broadcast'
        : 'activity';
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

    if (channelMode === 'broadcast') {
      return WHOLE_HOSTEL_BROADCAST_CHANNEL_ID;
    }

    if (!currentGuestUuid || !peerUuid || currentGuestUuid === peerUuid) {
      return null;
    }

    return buildDirectMessageChannelId(currentGuestUuid, peerUuid);
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
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activity = channelId ? activities[channelId] : undefined;
  const channelMessages = useMemo(() => channelId ? messages[channelId] ?? [] : [], [channelId, messages]);
  const lifecycle =
    channelMode === 'direct' || channelMode === 'broadcast'
      ? 'live'
      : activity
        ? resolveLifecycle(activity, Date.now())
        : 'upcoming';
  const isLive = lifecycle === 'live';

  // Set current channel on mount
  useEffect(() => {
    if (!channelId) {
      setCurrentChannelId(null);
      return;
    }

    if (channelMode === 'direct') {
      if (isProfilesLoading || !isDirectConversationAllowed) {
        setCurrentChannelId(null);
        return;
      }
    }

    setCurrentChannelId(channelId);

    return () => {
      setCurrentChannelId(null);
    };
  }, [channelId, channelMode, isDirectConversationAllowed, isProfilesLoading, setCurrentChannelId]);

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

    if (channelMode === 'broadcast') return;
    if (!channelId || !messageInput.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);
    try {
      const sendOptions =
        channelMode === 'direct' && peerUuid && currentBookingId
          ? { directMessage: { bookingId: currentBookingId, peerUuid } }
          : undefined;

      await sendMessage(channelId, messageInput, sendOptions);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setSendError(t('sendFailed', 'Message failed to send. Please try again.'));
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
      : channelMode === 'broadcast'
        ? t('staffMessages', 'Staff messages')
        : activity?.title || t('channelTitle', 'Activity Chat');

  const statusLabel =
    channelMode === 'direct'
      ? t('statusDirect', 'Direct chat')
      : channelMode === 'broadcast'
        ? t('statusBroadcast', 'Whole hostel')
        : isLive
          ? t('statusLive', 'Live now')
          : t('statusUpcoming', 'Starts soon');

  return (
    <main className="flex min-h-dvh flex-col bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="mx-auto flex w-full items-center gap-3">
          <Link
            href={channelMode === 'activity' ? '/activities' : '/chat'}
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
            const textContent = msg.content.trim();
            const attachments = msg.attachments ?? [];
            const imageAttachments = attachments.filter((attachment) => attachment.kind === 'image');
            const fileAttachments = attachments.filter((attachment) => attachment.kind === 'file');
            const imagePreviews = [
              ...(msg.imageUrl
                ? [{
                    id: 'legacy-image',
                    url: msg.imageUrl,
                    title: msg.senderName || t('messageImage', 'Message image'),
                  }]
                : []),
              ...imageAttachments
                .filter((attachment) => attachment.url !== msg.imageUrl)
                .map((attachment, index) => ({
                  id: attachment.id ?? `attachment-image-${index}`,
                  url: attachment.url,
                  title: attachment.title || attachment.altText || t('messageImage', 'Message image'),
                })),
            ];
            const hasBadges =
              msg.kind === 'promotion'
              || msg.kind === 'draft'
              || Boolean(msg.draft)
              || (msg.audience !== undefined && msg.audience !== 'thread');
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
                  {hasBadges && (
                    <Inline gap={1} className="mb-2 flex-wrap gap-1.5">
                      {msg.kind === 'promotion' && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-foreground">
                          {t('promotionMessage', 'Promotion')}
                        </span>
                      )}
                      {msg.kind === 'draft' && (
                        <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-primary">
                          {t('draftMessage', 'Draft suggestion')}
                        </span>
                      )}
                      {msg.audience && msg.audience !== 'thread' && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {formatAudienceLabel(msg.audience)}
                        </span>
                      )}
                      {msg.draft && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {`${msg.draft.source === 'agent' ? t('agentDraft', 'Agent draft') : t('staffDraft', 'Staff draft')} · ${formatDraftStatusLabel(msg.draft.status)}`}
                        </span>
                      )}
                    </Inline>
                  )}
                  {textContent && <div className="text-sm whitespace-pre-wrap">{textContent}</div>}
                  {msg.links && msg.links.length > 0 && (
                    <Inline gap={2} className="mt-3 flex-wrap">
                      {msg.links.map((linkItem, index) => (
                        <a
                          key={linkItem.id ?? `link-${index}`}
                          href={linkItem.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            isOwn
                              ? 'bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25'
                              : linkItem.variant === 'primary'
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'border border-border bg-background text-foreground hover:bg-muted'
                          }`}
                        >
                          {linkItem.label}
                        </a>
                      ))}
                    </Inline>
                  )}
                  {imagePreviews.length > 0 && (
                    <Grid gap={2} className="mt-3">
                      {imagePreviews.map((image) => (
                        <a
                          key={image.id}
                          href={image.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block min-h-11 min-w-11 overflow-hidden rounded-xl border border-border/60"
                        >
                          <div
                            className="h-40 w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${image.url})` }}
                            aria-label={image.title}
                            role="img"
                          />
                        </a>
                      ))}
                    </Grid>
                  )}
                  {msg.cards && msg.cards.length > 0 && (
                    <Grid gap={2} className="mt-3">
                      {msg.cards.map((card, index) => (
                        <div
                          key={card.id ?? `card-${index}`}
                          className={`overflow-hidden rounded-xl border ${
                            isOwn
                              ? 'border-primary-foreground/20 bg-primary-foreground/10'
                              : 'border-border bg-background'
                          }`}
                        >
                          {card.imageUrl && (
                            <div
                              className="h-32 w-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${card.imageUrl})` }}
                              aria-label={card.title}
                              role="img"
                            />
                          )}
                          <div className="space-y-2 p-3">
                            <div className="text-sm font-semibold">{card.title}</div>
                            {card.body && <div className="text-xs opacity-85">{card.body}</div>}
                            {card.ctaLabel && card.ctaUrl && (
                              <a
                                href={card.ctaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
                                  isOwn
                                    ? 'bg-primary-foreground text-primary'
                                    : 'bg-primary text-primary-foreground'
                                }`}
                              >
                                {card.ctaLabel}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </Grid>
                  )}
                  {fileAttachments.length > 0 && (
                    <Grid gap={2} className="mt-3">
                      {fileAttachments.map((attachment, index) => (
                        <a
                          key={attachment.id ?? `file-${index}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`rounded-xl border px-3 py-2 text-xs ${
                            isOwn
                              ? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground'
                              : 'border-border bg-muted/30 text-foreground'
                          }`}
                        >
                          {attachment.title || attachment.url}
                        </a>
                      ))}
                    </Grid>
                  )}
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
      {isLive && channelMode !== 'broadcast' && (
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
              <div className="space-y-2">
                {sendError && (
                  <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-foreground">
                    {sendError}
                  </p>
                )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => { setMessageInput(e.target.value); if (sendError) setSendError(null); }}
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
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
