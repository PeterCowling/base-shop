/**
 * ChatOptInControls.tsx
 *
 * Settings control for guest-to-guest messaging opt-in.
 * Allows guests to toggle chatOptIn on/off at any time.
 *
 * Privacy principles:
 * - Clear explanation of what chatOptIn enables
 * - Immediate effect on directory visibility and DM capability
 * - Existing threads become read-only when opted out
 */

'use client';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';

import logger from '@/utils/logger';

import { useGuestProfileMutator } from '../../hooks/mutator/useGuestProfileMutator';
import type { GuestProfile } from '../../types/guestProfile';

interface ChatOptInControlsProps {
  /** Current guest profile */
  profile: GuestProfile;
}

/**
 * Chat opt-in toggle control component.
 * Renders a toggle switch with description for chatOptIn setting.
 */
export default function ChatOptInControls({ profile }: ChatOptInControlsProps) {
  const { t } = useTranslation('Settings');
  const { updateProfile } = useGuestProfileMutator();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = useCallback(async () => {
    setIsUpdating(true);
    try {
      await updateProfile({ chatOptIn: !profile.chatOptIn });
    } catch (error) {
      logger.error('[ChatOptInControls] Failed to update chatOptIn:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [profile.chatOptIn, updateProfile]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <MessageCircle className="h-6 w-6 text-gray-600" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {t('chat.optIn.label')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t('chat.optIn.description')}
              </p>
            </div>
            <input
              type="checkbox"
              role="checkbox"
              aria-label={t('chat.optIn.label')}
              checked={profile.chatOptIn}
              onChange={handleToggle}
              disabled={isUpdating}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
          </label>

          {!profile.chatOptIn && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              {t('chat.optIn.optedOutNote')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
