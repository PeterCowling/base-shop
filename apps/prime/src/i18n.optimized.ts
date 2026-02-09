// File: /src/i18n.optimized.ts
// Optimized i18n configuration with on-demand namespace loading

import { initReactI18next } from 'react-i18next';
import i18n, { type InitOptions } from 'i18next';
import HttpBackend from 'i18next-http-backend';

// Define namespace groups based on route usage
export const NAMESPACE_GROUPS = {
  // Always loaded (critical)
  core: ['Header', 'Homepage', 'Reused'],

  // Lazy loaded by route
  breakfast: ['BreakfastMenu', 'CompBreakfast'],
  bar: ['BarMenu', 'CompEvDrink'],
  account: ['Account', 'BookingDetails', 'Payment'],
  activities: ['ActivityAdmin', 'GuestChat'],
  services: ['BagStorage', 'MainDoorAccess', 'OvernightIssues'],
  admin: ['DocInsert', 'DigitalAssistant', 'Onboarding'],
} as const;

// All available namespaces
const _ALL_NAMESPACES = [
  ...NAMESPACE_GROUPS.core,
  ...NAMESPACE_GROUPS.breakfast,
  ...NAMESPACE_GROUPS.bar,
  ...NAMESPACE_GROUPS.account,
  ...NAMESPACE_GROUPS.activities,
  ...NAMESPACE_GROUPS.services,
  ...NAMESPACE_GROUPS.admin,
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

i18n.use(HttpBackend).use(initReactI18next).init(i18nOptions);

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
  let group: keyof typeof NAMESPACE_GROUPS | null = null;

  if (route.includes('breakfast')) {
    group = 'breakfast';
  } else if (route.includes('bar')) {
    group = 'bar';
  } else if (route.includes('account') || route.includes('booking')) {
    group = 'account';
  } else if (route.includes('activity') || route.includes('chat')) {
    group = 'activities';
  } else if (
    route.includes('bag') ||
    route.includes('door') ||
    route.includes('issues')
  ) {
    group = 'services';
  } else if (route.includes('admin') || route.includes('assistant')) {
    group = 'admin';
  }

  if (group) {
    loadNamespaceGroup(group).catch((err) => {
      console.warn(`Failed to preload namespace group ${group}:`, err);
    });
  }
}

export default i18n;
