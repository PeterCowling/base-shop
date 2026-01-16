/**
 * HomePage.tsx
 *
 * The main guest home page that combines:
 * - Quest progress card
 * - Social highlights / activities card
 * - Task list (DoList)
 * - Services list
 *
 * The order of sections is personalized based on guest intent.
 */

'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GuestIntent } from '../../types/guestProfile';
import { useGuestProgressData } from '../../hooks/dataOrchestrator/useGuestProgressData';
import QuestCard from '../quests/QuestCard';
import SocialHighlightsCard from './SocialHighlightsCard';
import DoList from './DoList';
import ServicesList from './ServicesList';
import { useHomePageVisibility } from './useHomePageVisibility';
import { ProfileCompletionBanner } from '../profile/ProfileCompletionBanner';
import Container from '@/components/layout/Container';

type Section = 'quest' | 'social' | 'tasks' | 'services';

/**
 * Get section order based on guest intent
 */
function getSectionOrder(intent: GuestIntent): Section[] {
  switch (intent) {
    case 'social':
      // Social-focused guests see social first
      return ['social', 'quest', 'tasks', 'services'];
    case 'quiet':
      // Quiet guests see quest first, social de-emphasized (still shown but last)
      return ['quest', 'tasks', 'services', 'social'];
    case 'mixed':
    default:
      // Mixed intent: balanced order
      return ['quest', 'social', 'tasks', 'services'];
  }
}

export const HomePage = memo(function HomePage() {
  const { t } = useTranslation('Homepage');

  // Guest profile and quest progress data
  const {
    guestProfile,
    isProfileStale,
    effectiveProfileStatus,
    showProfileBanner,
    isLoading: profileLoading,
    error: profileError,
  } = useGuestProgressData();

  // Homepage visibility logic (tasks, services)
  const {
    occupantLoading,
    occupantError,
    occupantData,
    isTaskCompleted,
    allTasksCompleted,
    filteredTasks,
    serviceCards,
  } = useHomePageVisibility();

  // Determine guest intent (default to mixed)
  const intent = guestProfile?.intent ?? 'mixed';
  const sectionOrder = useMemo(() => getSectionOrder(intent), [intent]);

  // Combined loading state
  const isLoading = occupantLoading || profileLoading;

  // Combined error
  const error = occupantError || profileError;

  // Guest first name for welcome
  const firstName = occupantData?.firstName || t('guest', { defaultValue: 'Guest' });

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">{t('loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="p-4 text-center mt-5 text-red-600">
        {t('error.loadInfo', { defaultValue: 'Error loading information. Please try again.' })}
      </div>
    );
  }

  // --- Missing data state ---
  if (!occupantData) {
    return (
      <div className="p-4 text-center mt-5 text-red-600">
        {t('error.missingData', { defaultValue: 'Unable to load your booking information.' })}
      </div>
    );
  }

  // --- Render section by type ---
  const renderSection = (section: Section) => {
    switch (section) {
      case 'quest':
        return <QuestCard key="quest" className="mb-6" />;
      case 'social':
        // Don't show social card for quiet guests if they haven't opted in
        if (intent === 'quiet' && !guestProfile?.socialOptIn) {
          return null;
        }
        return <SocialHighlightsCard key="social" className="mb-6" intent={intent} />;
      case 'tasks':
        // Only show tasks if there are any left
        if (allTasksCompleted || filteredTasks.length === 0) {
          return null;
        }
        return (
          <DoList
            key="tasks"
            tasks={filteredTasks}
            isTaskCompleted={isTaskCompleted}
            className="mb-6"
          />
        );
      case 'services':
        // Only show services if there are any
        if (serviceCards.length === 0) {
          return null;
        }
        return <ServicesList key="services" services={serviceCards} className="mb-6" />;
      default:
        return null;
    }
  };

  return (
    <Container className="relative max-w-md px-4 pb-24 pt-6">
      {/* Welcome header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('welcome.greeting', { firstName, defaultValue: `Welcome, ${firstName}!` })}
      </h1>

      {/* Profile completion banner (if needed) */}
      {showProfileBanner && (
        <ProfileCompletionBanner
          isStale={isProfileStale}
          profileStatus={effectiveProfileStatus}
        />
      )}

      {/* Dynamic section ordering based on intent */}
      {sectionOrder.map((section) => renderSection(section))}
    </Container>
  );
});

HomePage.displayName = 'HomePage';
export default HomePage;
