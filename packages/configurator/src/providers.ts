export interface Provider {
  id: string;
  name: string;
  type: 'payment' | 'shipping' | 'analytics';
}

// i18n-exempt: Provider display names are identifiers; app/UI handles localization
export const providers: Provider[] = [
  { id: 'stripe', name: 'Stripe', type: 'payment' }, // i18n-exempt: provider display name; localized in app UI (ENG-1234)
  { id: 'paypal', name: 'PayPal', type: 'payment' }, // i18n-exempt: provider display name; localized in app UI (ENG-1234)
  { id: 'dhl', name: 'DHL', type: 'shipping' }, // i18n-exempt: provider display name; localized in app UI (ENG-1234)
  { id: 'ups', name: 'UPS', type: 'shipping' }, // i18n-exempt: provider display name; localized in app UI (ENG-1234)
  { id: 'ga', name: 'Google Analytics', type: 'analytics' }, // i18n-exempt: provider display name; localized in app UI (ENG-1234)
];

export function providersByType(type: Provider['type']): Provider[] {
  return providers.filter((p) => p.type === type);
}
