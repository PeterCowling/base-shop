// Storybook-local types to avoid cross-package coupling

export type StoryLocale = 'en' | 'de' | 'fr' | 'ar';
export type StoryCurrency = 'USD' | 'EUR' | 'GBP';
export type StoryNetProfile = 'fast' | 'normal' | 'slow';
export type StoryDataScenario = 'featured' | 'new' | 'bestsellers' | 'clearance' | 'limited';

export type StoryDataState = 'default' | 'loading' | 'empty' | 'error' | 'skeleton';

export interface ToolbarGlobals {
  tokens: 'base' | 'brandx';
  locale: StoryLocale;
  currency: StoryCurrency;
  net: StoryNetProfile;
  netError: 'on' | 'off';
  scenario: StoryDataScenario;
}

declare global {
  interface Window {
    __SB_GLOBALS__?: Partial<ToolbarGlobals>;
  }
}

