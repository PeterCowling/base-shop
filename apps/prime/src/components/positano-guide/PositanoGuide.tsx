/* eslint-disable ds/min-tap-size -- BRIK-2 tap-size deferred */
/**
 * PositanoGuide.tsx
 *
 * Displays curated local guides organized by time of day.
 * Links to the brikette website for full guide content.
 * Tracks first visit for quest progress.
 */

'use client';

import { type FC, memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin, Sparkles, Sun, Sunset } from 'lucide-react';

import { useUnifiedBookingData } from '@/hooks/dataOrchestrator/useUnifiedBookingData';
import { useCompletedTaskMutator } from '@/hooks/mutator/useCompletedTaskMutator';

/** Brikette website base URL */
const BRIKETTE_BASE_URL = 'https://hostel-positano.com';

/** Guide configuration with time-of-day categorization */
interface GuideConfig {
  key: string;
  slug: string;
  i18nKey: string;
  icon?: 'sunrise' | 'sun' | 'sunset';
}

const MORNING_GUIDES: GuideConfig[] = [
  { key: 'sunriseHike', slug: 'sunrise-hike-positano', i18nKey: 'sunriseHike', icon: 'sunrise' },
  { key: 'cheapEats', slug: 'cheap-eats-positano', i18nKey: 'cheapEats' },
];

const AFTERNOON_GUIDES: GuideConfig[] = [
  { key: 'fornilloBeach', slug: 'fornillo-beach-guide', i18nKey: 'fornilloBeach' },
  { key: 'pathOfTheGods', slug: 'path-of-the-gods', i18nKey: 'pathOfTheGods', icon: 'sun' },
  { key: 'positanoBeaches', slug: 'positano-beaches', i18nKey: 'positanoBeaches' },
  { key: 'boatTours', slug: 'boat-tours-positano', i18nKey: 'boatTours' },
];

const EVENING_GUIDES: GuideConfig[] = [
  { key: 'eatingOut', slug: 'eating-out-positano', i18nKey: 'eatingOut' },
  { key: 'sunsetViewpoints', slug: 'sunset-viewpoints-positano', i18nKey: 'sunsetViewpoints', icon: 'sunset' },
];

interface GuideSectionProps {
  sectionId: string;
  title: string;
  subtitle: string;
  guides: GuideConfig[];
  lang: string;
  t: (key: string) => string;
  icon: FC<{ className?: string }>;
}

const GuideSection: FC<GuideSectionProps> = memo(function GuideSection({
  sectionId,
  title,
  subtitle,
  guides,
  lang,
  t,
  icon: Icon,
}) {
  return (
    <section id={sectionId} className="mb-8 scroll-mt-24">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-warning-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {guides.map((guide) => (
          <GuideCard
            key={guide.key}
            guide={guide}
            lang={lang}
            title={t(`guides.${guide.i18nKey}.title`)}
            description={t(`guides.${guide.i18nKey}.description`)}
            tag={t(`guides.${guide.i18nKey}.tag`)}
          />
        ))}
      </div>
    </section>
  );
});

interface GuideCardProps {
  guide: GuideConfig;
  lang: string;
  title: string;
  description: string;
  tag: string;
}

const GuideCard: FC<GuideCardProps> = memo(function GuideCard({
  guide,
  lang,
  title,
  description,
  tag,
}) {
  const guideUrl = `${BRIKETTE_BASE_URL}/${lang}/guides/${guide.slug}`;

  return (
    <a
      href={guideUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-success hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-success">
              {title}
            </h3>
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-foreground">
              {tag}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-success" />
      </div>
    </a>
  );
});

const PositanoGuide: FC = memo(function PositanoGuide() {
  const { t, i18n } = useTranslation('PositanoGuide');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeTask } = useCompletedTaskMutator({});
  const { occupantData } = useUnifiedBookingData();

  // Get current language, defaulting to 'en'
  const lang = useMemo(() => {
    const currentLang = i18n.language?.split('-')[0] || 'en';
    // Map to supported brikette languages
    const supportedLangs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'zh'];
    return supportedLangs.includes(currentLang) ? currentLang : 'en';
  }, [i18n.language]);

  useEffect(() => {
    const topic = searchParams?.get('topic');
    if (!topic) {
      return;
    }

    const topicMap: Record<string, string> = {
      transport: 'guide-morning',
      activities: 'guide-afternoon',
      local_tips: 'guide-evening',
      neighborhoods: 'guide-afternoon',
      food: 'guide-evening',
    };
    const targetId = topicMap[topic];
    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  // Track guidebook visit on first render
  useEffect(() => {
    const hasVisited = occupantData?.completedTasks?.guidebookVisited === 'true';
    if (!hasVisited) {
      void completeTask('guidebookVisited', true);
    }
  }, [completeTask, occupantData?.completedTasks?.guidebookVisited]);

  const handleBack = useCallback(() => {
    const search = searchParams?.toString();
    router.push(search ? `/?${search}` : '/');
  }, [router, searchParams]);

  return (
    <div className="min-h-svh bg-muted">
      {/* Header */}
      {/* eslint-disable-next-line ds/no-nonlayered-zindex -- PRIME-1: positano guide sticky header, awaiting DS modal/popover migration */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-full p-2 transition-colors hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {t('meta.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('meta.subtitle')}</p>
          </div>
          <MapPin className="ms-auto h-5 w-5 text-success" />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Popular badge */}
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2">
          <Sparkles className="h-4 w-4 text-warning-foreground" />
          <span className="text-sm font-medium text-warning-foreground">
            {t('cta.popularWithGuests')}
          </span>
        </div>

        {/* Morning section */}
        <GuideSection
          sectionId="guide-morning"
          title={t('sections.morning.title')}
          subtitle={t('sections.morning.subtitle')}
          guides={MORNING_GUIDES}
          lang={lang}
          t={t}
          icon={Sun}
        />

        {/* Afternoon section */}
        <GuideSection
          sectionId="guide-afternoon"
          title={t('sections.afternoon.title')}
          subtitle={t('sections.afternoon.subtitle')}
          guides={AFTERNOON_GUIDES}
          lang={lang}
          t={t}
          icon={Sun}
        />

        {/* Evening section */}
        <GuideSection
          sectionId="guide-evening"
          title={t('sections.evening.title')}
          subtitle={t('sections.evening.subtitle')}
          guides={EVENING_GUIDES}
          lang={lang}
          t={t}
          icon={Sunset}
        />

        {/* Attribution */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          {t('cta.poweredBy')}
        </div>
      </main>
    </div>
  );
});

export default PositanoGuide;
