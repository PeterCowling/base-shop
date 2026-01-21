import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import OrdersPage from '../Orders';
import ProfilePage from '../Profile';
import SessionsPage from '../Sessions';

// Mock server translations to a simple key→message map
const messages: Record<string, string> = {
  'account.profile.title': 'Profile',
  'account.sessions.title': 'Sessions',
  'account.orders.title': 'Orders',
};

jest.mock('@acme/i18n/useTranslations.server', () => ({
  useTranslations: async () => (key: string) => messages[key] ?? key,
}));

// Mock auth/session APIs used by pages
jest.mock('@acme/auth', () => ({
  getCustomerSession: async () => ({ customerId: 'c1', role: 'user' }),
  hasPermission: () => true,
  listSessions: async () => [{ sessionId: 's1', userAgent: 'UA', createdAt: new Date() }],
}));

// Mock customer profile API used by ProfilePage
jest.mock('@acme/platform-core/customerProfiles', () => ({
  getCustomerProfile: async () => ({ name: 'Test User', email: 'test@example.com' }),
}));

// Orders dependencies
jest.mock('@acme/platform-core/orders', () => ({
  getOrdersForCustomer: async () => [{ id: 'o1', sessionId: 'sess1' }],
}));
// Avoid rendering the real timeline in Orders
jest.mock('../../organisms/OrderTrackingTimeline', () => ({
  OrderTrackingTimeline: () => <div data-cy="timeline" />,
}));

// Avoid Next redirect throwing and mock router hooks used in child components
jest.mock('next/navigation', () => ({
  redirect: () => undefined,
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}));

describe('Account page headings i18n', () => {
  it('ProfilePage uses key/inline headings', async () => {
    const el1 = await ProfilePage({ title: { type: 'key', key: 'account.profile.title' }, locale: 'en' });
    render(el1 as any);
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();

    const el2 = await ProfilePage({ title: { type: 'inline', value: { de: 'Profil' } }, locale: 'de' });
    render(el2 as any);
    expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
  });

  it('SessionsPage uses key/inline headings', async () => {
    const el1 = await SessionsPage({ title: { type: 'key', key: 'account.sessions.title' }, locale: 'en' });
    render(el1 as any);
    expect(screen.getByRole('heading', { name: 'Sessions' })).toBeInTheDocument();

    const el2 = await SessionsPage({ title: { type: 'inline', value: { de: 'Sitzungen' } }, locale: 'de' });
    render(el2 as any);
    expect(screen.getByRole('heading', { name: 'Sitzungen' })).toBeInTheDocument();
  });

  it('OrdersPage uses key/inline headings', async () => {
    const el1 = await OrdersPage({ shopId: 'shop', title: { type: 'key', key: 'account.orders.title' }, trackingEnabled: false, trackingProviders: [], returnsEnabled: false, locale: 'en' });
    render(el1 as any);
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();

    const el2 = await OrdersPage({ shopId: 'shop', title: { type: 'inline', value: { de: 'Bestellungen' } }, trackingEnabled: false, trackingProviders: [], returnsEnabled: false, locale: 'de' });
    render(el2 as any);
    expect(screen.getByRole('heading', { name: 'Bestellungen' })).toBeInTheDocument();
  });
});
