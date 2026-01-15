/**
 * ProfileCompletionBanner.tsx
 *
 * A lightweight banner shown on the home screen when the guest's profile
 * is incomplete or stale (from a previous booking).
 *
 * Display logic:
 * - Show if profileStatus !== 'complete'
 * - Show if profile.bookingId !== currentBookingId (stale)
 * - Hide if profile is complete and matches current booking
 */

import { Button } from '@acme/ui';
import { User } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/lib/router';

export interface ProfileCompletionBannerProps {
  /** Whether the profile is from a previous booking */
  isStale: boolean;
  /** The current profile status */
  profileStatus: 'complete' | 'skipped' | 'partial' | null;
}

function ProfileCompletionBannerComponent({
  isStale,
  profileStatus,
}: ProfileCompletionBannerProps) {
  const { t } = useTranslation('Homepage');

  // Don't show if profile is complete and not stale
  if (profileStatus === 'complete' && !isStale) {
    return null;
  }

  // Determine message based on state
  const isReturningGuest = isStale;
  const wasSkipped = profileStatus === 'skipped';

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            {isReturningGuest
              ? t('profileBanner.returningTitle', 'Welcome back!')
              : t('profileBanner.title', 'Complete your profile')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isReturningGuest
              ? t(
                  'profileBanner.returningDescription',
                  'Update your preferences for this stay to get personalized recommendations.',
                )
              : wasSkipped
                ? t(
                    'profileBanner.skippedDescription',
                    'Add your preferences to get better recommendations.',
                  )
                : t(
                    'profileBanner.description',
                    'Tell us about your stay to get personalized tips.',
                  )}
          </p>
          <Link to="/account/profile" className="inline-block mt-2">
            <Button variant="outline" size="sm">
              {isReturningGuest
                ? t('profileBanner.updateButton', 'Update preferences')
                : t('profileBanner.completeButton', 'Complete profile')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const ProfileCompletionBanner = memo(ProfileCompletionBannerComponent);
ProfileCompletionBanner.displayName = 'ProfileCompletionBanner';

export { ProfileCompletionBanner };
