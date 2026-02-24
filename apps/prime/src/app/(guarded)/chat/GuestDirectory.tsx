/**
 * GuestDirectory.tsx
 *
 * Directory of guests available for direct messaging.
 * Filters by mutual chatOptIn consent and block lists.
 *
 * Privacy principles:
 * - Only shows mutually opted-in guests
 * - Excludes blocked users (bilateral)
 * - Excludes current user
 * - Shows opt-in prompt when current user is opted out
 */

'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users } from 'lucide-react';

import { Button } from '@acme/design-system/primitives';

import logger from '@/utils/logger';

import { useGuestProfiles } from '../../../hooks/data/useGuestProfiles';
import useUuid from '../../../hooks/useUuid';
import { readGuestSession } from '../../../lib/auth/guestSessionGuard';
import { buildDirectMessageChannelId } from '../../../lib/chat/directMessageChannel';
import { isVisibleInDirectory } from '../../../lib/chat/messagingPolicy';
import type { GuestProfile } from '../../../types/guestProfile';

/**
 * Guest directory component.
 * Shows guests available for direct messaging based on mutual opt-in.
 */
export default function GuestDirectory() {
  const { t } = useTranslation('Chat');
  const router = useRouter();
  const { profiles, isLoading } = useGuestProfiles();
  const currentUuid = useUuid();
  const { bookingId: currentBookingId } = readGuestSession();

  // Get current user's profile
  const currentProfile = currentUuid ? profiles[currentUuid] : null;

  // Filter eligible guests
  const eligibleGuests = useMemo(() => {
    if (
      !currentProfile
      || !currentUuid
      || !currentBookingId
      || currentProfile.bookingId !== currentBookingId
    ) {
      return [];
    }

    return Object.entries(profiles)
      .filter(([uuid, profile]) => {
        // Exclude current user
        if (uuid === currentUuid) {
          return false;
        }

        // Scope directory to confirmed guests in the same booking/stay
        if (profile.bookingId !== currentBookingId) {
          return false;
        }

        // Check if visible (mutual opt-in, not blocked)
        return isVisibleInDirectory(profile, uuid, currentProfile, currentUuid);
      })
      .map(([uuid, profile]) => ({ uuid, profile }));
  }, [currentBookingId, profiles, currentProfile, currentUuid]);

  // Show opt-in required if current user hasn't opted in
  if (currentProfile && !currentProfile.chatOptIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-6 text-center">
        <MessageCircle className="h-16 w-16 text-border mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t('chat.directory.optInRequired')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('chat.directory.optInDescription')}
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">{t('chat.directory.loading')}</div>
      </div>
    );
  }

  // Show empty state if no eligible guests
  if (eligibleGuests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-6 text-center">
        <Users className="h-16 w-16 text-border mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t('chat.directory.noGuests')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('chat.directory.noGuestsDescription')}
        </p>
      </div>
    );
  }

  // Render directory
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          {t('chat.directory.title')}
        </h2>
      </div>

      <div className="space-y-2">
        {eligibleGuests.map(({ uuid, profile }) => (
          <GuestCard
            key={uuid}
            uuid={uuid}
            profile={profile}
            currentUuid={currentUuid}
            onStartChat={(targetUuid) => {
              if (!currentUuid) {
                return;
              }

              const channelId = buildDirectMessageChannelId(currentUuid, targetUuid);
              const searchParams = new URLSearchParams({
                id: channelId,
                mode: 'direct',
                peer: targetUuid,
              });

              router.push(`/chat/channel?${searchParams.toString()}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual guest card in directory.
 */
function GuestCard({
  uuid,
  profile,
  currentUuid,
  onStartChat,
}: {
  uuid: string;
  profile: GuestProfile;
  currentUuid: string | null;
  onStartChat: (targetUuid: string) => void;
}) {
  const { t } = useTranslation('Chat');

  const handleStartChat = () => {
    if (!currentUuid) {
      return;
    }

    logger.info('[GuestDirectory] Starting direct chat', {
      from: currentUuid,
      to: uuid,
    }); // i18n-exempt -- DS-11 developer diagnostic
    onStartChat(uuid);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center">
          <span className="text-info-foreground font-medium text-sm">
            {uuid.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-foreground">{t('chat.directory.guestLabel', { id: uuid.substring(0, 8) })}</p>
          <p className="text-xs text-muted-foreground">
            {profile.intent === 'social' ? t('chat.directory.social') : t('chat.directory.quiet')}
          </p>
        </div>
      </div>

      <Button
        onClick={handleStartChat}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        {t('chat.directory.startChat')}
      </Button>
    </div>
  );
}
