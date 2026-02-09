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
import { MessageCircle, Users } from 'lucide-react';

import { Button } from '@acme/design-system/primitives';

import logger from '@/utils/logger';

import { useGuestProfiles } from '../../../hooks/data/useGuestProfiles';
import useUuid from '../../../hooks/useUuid';
import { isVisibleInDirectory } from '../../../lib/chat/messagingPolicy';
import type { GuestProfile } from '../../../types/guestProfile';

/**
 * Guest directory component.
 * Shows guests available for direct messaging based on mutual opt-in.
 */
export default function GuestDirectory() {
  const { t } = useTranslation('Chat');
  const { profiles, isLoading } = useGuestProfiles();
  const currentUuid = useUuid();

  // Get current user's profile
  const currentProfile = currentUuid ? profiles[currentUuid] : null;

  // Filter eligible guests
  const eligibleGuests = useMemo(() => {
    if (!currentProfile || !currentUuid) {
      return [];
    }

    return Object.entries(profiles)
      .filter(([uuid, profile]) => {
        // Exclude current user
        if (uuid === currentUuid) {
          return false;
        }

        // Check if visible (mutual opt-in, not blocked)
        return isVisibleInDirectory(profile, uuid, currentProfile, currentUuid);
      })
      .map(([uuid, profile]) => ({ uuid, profile }));
  }, [profiles, currentProfile, currentUuid]);

  // Show opt-in required if current user hasn't opted in
  if (currentProfile && !currentProfile.chatOptIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('chat.directory.optInRequired')}
        </h2>
        <p className="text-sm text-gray-600 max-w-md">
          {t('chat.directory.optInDescription')}
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">{t('chat.directory.loading')}</div>
      </div>
    );
  }

  // Show empty state if no eligible guests
  if (eligibleGuests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('chat.directory.noGuests')}
        </h2>
        <p className="text-sm text-gray-600 max-w-md">
          {t('chat.directory.noGuestsDescription')}
        </p>
      </div>
    );
  }

  // Render directory
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-900">
          {t('chat.directory.title')}
        </h2>
      </div>

      <div className="space-y-2">
        {eligibleGuests.map(({ uuid, profile }) => (
          <GuestCard key={uuid} uuid={uuid} profile={profile} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual guest card in directory.
 */
function GuestCard({ uuid, profile }: { uuid: string; profile: GuestProfile }) {
  const { t } = useTranslation('Chat');

  const handleStartChat = () => {
    logger.info('[GuestDirectory] Starting chat with:', uuid);
    // TODO: Navigate to conversation when messaging is implemented
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-700 font-medium text-sm">
            {uuid.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">Guest {uuid.substring(0, 8)}</p>
          <p className="text-xs text-gray-500">
            {profile.intent === 'social' ? t('chat.directory.social') : t('chat.directory.quiet')}
          </p>
        </div>
      </div>

      <Button
        onClick={handleStartChat}
        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        {t('chat.directory.startChat')}
      </Button>
    </div>
  );
}
