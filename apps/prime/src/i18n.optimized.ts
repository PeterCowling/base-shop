// File: /src/i18n.optimized.ts
// Optimized i18n configuration with on-demand namespace loading

import { initReactI18next } from 'react-i18next';
import i18n, { type InitOptions } from 'i18next';
import HttpBackend from 'i18next-http-backend';

// Define namespace groups based on actual useTranslation usage (DS-05)
export const NAMESPACE_GROUPS = {
  // Always loaded (critical — homepage and profile)
  core: ['Homepage'],

  // Lazy loaded by route/feature area
  preArrival: ['PreArrival', 'BookingDetails', 'rooms'],
  social: ['Chat', 'Activities', 'Quests'],
  onboarding: ['Onboarding', 'FindMyStay'],
  settings: ['Settings', 'PositanoGuide'],
} as const;

// All available namespaces
const _ALL_NAMESPACES = [
  ...NAMESPACE_GROUPS.core,
  ...NAMESPACE_GROUPS.preArrival,
  ...NAMESPACE_GROUPS.social,
  ...NAMESPACE_GROUPS.onboarding,
  ...NAMESPACE_GROUPS.settings,
];

const i18nOptions: InitOptions = {
  fallbackLng: 'en',
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  interpolation: {
    escapeValue: false,
  },
  // Only load core namespaces initially
  ns: NAMESPACE_GROUPS.core,
  defaultNS: 'Homepage',

  // Preload only critical namespaces
  preload: ['en'], // Only preload default language

  // Enable namespace lazy loading
  partialBundledLanguages: true,

  // Optimize backend loading
  react: {
    useSuspense: true, // Use Suspense for better UX
  },
};

// Guard: only initialize in the browser. During SSR module evaluation,
// initReactI18next tries to access React Context which is null.
if (typeof window !== 'undefined') {
  i18n.use(HttpBackend).use(initReactI18next).init(i18nOptions);
} else {
  // Minimal server-side init without React binding or HTTP backend
  i18n.init({ ...i18nOptions, backend: undefined });
}

// Helper function to load namespace group
export async function loadNamespaceGroup(
  group: keyof typeof NAMESPACE_GROUPS
): Promise<void> {
  const namespaces = NAMESPACE_GROUPS[group];
  const _currentLng = i18n.language;

  const promises = namespaces.map((ns) =>
    i18n.loadNamespaces(ns, (err) => {
      if (err) {
        console.warn(`Failed to load namespace ${ns}:`, err);
      }
    })
  );

  await Promise.all(promises);
}

// Helper function to preload namespaces for a route
export function preloadNamespacesForRoute(route: string): void {
  const groups: Array<keyof typeof NAMESPACE_GROUPS> = [];

  if (
    route.includes('booking') ||
    route.includes('checkin') ||
    route.includes('arrival') ||
    route.includes('welcome') ||
    route.includes('route')
  ) {
    groups.push('preArrival');
  }
  if (
    route.includes('activity') ||
    route.includes('chat') ||
    route.includes('quest')
  ) {
    groups.push('social');
  }
  if (route.includes('onboarding') || route.includes('find-my-stay')) {
    groups.push('onboarding');
  }
  if (route.includes('setting') || route.includes('positano')) {
    groups.push('settings');
  }

  for (const group of groups) {
    loadNamespaceGroup(group).catch((err) => {
      console.warn(`Failed to preload namespace group ${group}:`, err);
    });
  }
}

export default i18n;
