export interface Provider {
  id: string;
  name: string;
  type: 'payment' | 'shipping' | 'analytics';
}

export const providers: Provider[] = [
  { id: 'stripe', name: 'Stripe', type: 'payment' },
  { id: 'paypal', name: 'PayPal', type: 'payment' },
  { id: 'dhl', name: 'DHL', type: 'shipping' },
  { id: 'ups', name: 'UPS', type: 'shipping' },
  { id: 'ga', name: 'Google Analytics', type: 'analytics' },
];

export function providersByType(type: Provider['type']): Provider[] {
  return providers.filter((p) => p.type === type);
}
