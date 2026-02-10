/**
 * DS Migration Tests — Light Route Pages (TASK-12)
 *
 * Verifies that 26 route page files have no raw Tailwind
 * palette classes after migration to semantic DS theme tokens.
 *
 * Test strategy: render each component with minimal mocks, then assert
 * the rendered DOM contains zero raw color classes.
 */

import { act, render } from '@testing-library/react';

// ── RAW PALETTE PATTERNS ────────────────────────────────────────────
const RAW_PALETTE = /(^|\s)(bg|text|border|ring|shadow|divide|placeholder|stroke|fill|from|to|via)-(gray|slate|blue|green|emerald|red|amber|yellow|orange|purple|indigo|teal|sky|cyan|violet|rose|lime|fuchsia|pink|white)-\d+/;
const RAW_WHITE = /(^|\s)(bg|text|border)-white(?:\s|"|$)/;
const ARBITRARY_HEX = /(bg|text|border)-\[#[0-9a-fA-F]+\]/;

function assertNoRawPaletteClasses(html: string, _componentName: string) {
  const match = html.match(RAW_PALETTE);
  expect(match).toBeNull();
}

function assertNoRawWhite(html: string, _componentName: string) {
  const match = html.match(RAW_WHITE);
  expect(match).toBeNull();
}

function assertNoArbitraryColors(html: string, _componentName: string) {
  const match = html.match(ARBITRARY_HEX);
  expect(match).toBeNull();
}

// ── SHARED MOCKS ────────────────────────────────────────────────────

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock next/navigation — stable router ref to avoid infinite useEffect loops
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>) =>
      typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () =>
  new Proxy({}, {
    get: (_, name) => {
      if (name === '__esModule') return true;
      return function MockIcon(props: any) {
        return <span data-testid={`icon-${String(name)}`} {...props} />;
      };
    },
  }),
);

// Mock design system
jest.mock('@acme/design-system/primitives', () => ({
  Button: (props: any) => <button {...props} />,
  Card: (props: any) => <div data-testid="ds-card" {...props} />,
}));

// Mock guest session
jest.mock('../../lib/auth/guestSessionGuard', () => ({
  readGuestSession: jest.fn(() => ({ token: 'test-token', uuid: 'test-uuid' })),
  validateGuestToken: jest.fn(() => Promise.resolve('valid')),
  clearGuestSession: jest.fn(),
  buildGuestHomeUrl: jest.fn(() => '/home'),
}));

// Mock PinAuthProvider
jest.mock('../../contexts/messaging/PinAuthProvider', () => ({
  PinAuthProvider: ({ children }: any) => <>{children}</>,
  usePinAuth: jest.fn(() => ({ isAuthenticated: true, role: 'staff' })),
}));

// Mock ChatProvider
jest.mock('../../contexts/messaging/ChatProvider', () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: jest.fn(() => ({ activities: {}, messages: {} })),
}));

// Mock session validation
jest.mock('../../hooks/useSessionValidation', () => ({
  useSessionValidation: jest.fn(),
}));

// Mock MealOrderPage
jest.mock('../../components/meal-orders/MealOrderPage', () => {
  return function MockMealOrderPage(props: any) {
    return <div data-testid="meal-order" className={props.iconClassName} />;
  };
});

// Mock activation funnel
jest.mock('../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
  readActivationFunnelEvents: jest.fn(() => []),
  aggregateActivationFunnel: jest.fn(() => ({ steps: [] })),
}));

// Mock security
jest.mock('../../lib/security/staffOwnerGate', () => ({
  canAccessStaffOwnerRoutes: jest.fn(() => true),
  getStaffOwnerGateMessage: jest.fn(() => 'Disabled'),
}));

// Mock StaffOwnerDisabledNotice
jest.mock('../../components/security/StaffOwnerDisabledNotice', () => {
  return function MockNotice() {
    return <div data-testid="disabled-notice" />;
  };
});

// Mock ActivationFunnelSummary
jest.mock('../../components/owner/ActivationFunnelSummary', () => ({
  __esModule: true,
  default: function MockFunnelSummary() {
    return <div data-testid="funnel-summary" />;
  },
}));

// Mock useGuestBookingSnapshot
jest.mock('../../hooks/dataOrchestrator/useGuestBookingSnapshot', () => ({
  useGuestBookingSnapshot: jest.fn(() => ({
    snapshot: {
      bookingId: 'BOOK123',
      reservationCode: 'BOOK123',
      checkInDate: '2099-02-10',
      checkOutDate: '2099-02-12',
      roomAssignment: '3A',
      isCheckedIn: false,
      arrivalState: 'pre-arrival',
      bagStorage: null,
      requestSummary: {},
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    token: 'test-token',
  })),
}));

// Mock useUnifiedBookingData
jest.mock('../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: jest.fn(() => ({
    data: { booking: { checkInDate: '2099-02-10' } },
    isLoading: false,
  })),
}));

// Mock usePreArrivalState
jest.mock('../../hooks/usePreArrivalState', () => ({
  usePreArrivalState: jest.fn(() => ({
    state: 'active',
    isLoading: false,
  })),
}));

// Mock component dependencies for data-hook pages
jest.mock('../../components/routes/RoutePlanner', () => ({
  __esModule: true,
  default: function MockRoutePlanner() {
    return <div data-testid="route-planner" />;
  },
}));

jest.mock('../../components/pre-arrival/CashPrep', () => ({
  __esModule: true,
  default: function MockCashPrep() {
    return <div data-testid="cash-prep" />;
  },
}));

jest.mock('../../components/pre-arrival/EtaConfirmation', () => ({
  __esModule: true,
  default: function MockEtaConfirmation() {
    return <div data-testid="eta-confirmation" />;
  },
}));

// Mock guest profiles hook for GuestDirectory
jest.mock('../../hooks/data/useGuestProfiles', () => ({
  useGuestProfiles: jest.fn(() => ({
    profiles: {},
    isLoading: false,
  })),
}));

// Mock useUuid
jest.mock('@/hooks/useUuid', () => ({
  __esModule: true,
  default: jest.fn(() => 'test-uuid'),
}));

// Mock digital assistant helpers
jest.mock('../../lib/assistant/answerComposer', () => ({
  composeAssistantAnswer: jest.fn(() => Promise.resolve('test answer')),
  validateAssistantLinks: jest.fn(() => []),
}));

// Mock guest session guard for portal
jest.mock('../../lib/preArrival/arrivalState', () => ({
  getGuestArrivalState: jest.fn(() => 'pre-arrival'),
}));

// Mock GuidedOnboardingFlow for portal
jest.mock('../../components/portal/GuidedOnboardingFlow', () => ({
  __esModule: true,
  default: function MockOnboarding() {
    return <div data-testid="onboarding" />;
  },
}));

// Mock GuardedHomeExperience for home page
jest.mock('../../components/homepage/GuardedHomeExperience', () => ({
  __esModule: true,
  default: function MockHome() {
    return <div data-testid="home" />;
  },
}));

// Mock for @/lib/security/dataAccessModel
jest.mock('@/lib/security/dataAccessModel', () => ({
  evaluateSdkAccess: jest.fn(() => ({ allowed: true })),
  isSdkFlowFeatureEnabled: jest.fn(() => true),
}));

// Mock directory visibility
jest.mock('../../lib/chat/messagingPolicy', () => ({
  isVisibleInDirectory: jest.fn(() => true),
}));

// Mock localStorage for digital assistant
const mockLocalStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  }),
) as jest.Mock;

// Mock window.location
delete (window as any).location;
(window as any).location = { href: '', replace: jest.fn() };

// ── TESTS ───────────────────────────────────────────────────────────

describe('TASK-12: Route pages — DS migration', () => {
  // Group A: Simple placeholder pages
  it.each([
    ['overnight-issues', '../(guarded)/overnight-issues/page'],
    ['language-selector', '../(guarded)/language-selector/page'],
    ['chat', '../(guarded)/chat/page'],
    ['chat-activities', '../(guarded)/chat/activities/page'],
    ['bar-menu', '../(guarded)/bar-menu/page'],
    ['manage-activities', '../(guarded)/chat/activities/manage/page'],
    ['breakfast-menu', '../(guarded)/breakfast-menu/page'],
    ['main-door-access', '../(guarded)/main-door-access/page'],
  ])('%s has no raw palette classes', (name, modulePath) => {
    const Component = jest.requireActual(modulePath).default;
    const { container } = render(<Component />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, name);
    assertNoRawWhite(html, name);
    assertNoArbitraryColors(html, name);
  });

  // Group B: MealOrderPage wrappers
  it.each([
    ['complimentary-breakfast', '../(guarded)/complimentary-breakfast/page'],
    ['complimentary-evening-drink', '../(guarded)/complimentary-evening-drink/page'],
  ])('%s has no raw palette classes', (name, modulePath) => {
    const Component = jest.requireActual(modulePath).default;
    const { container } = render(<Component />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, name);
    assertNoRawWhite(html, name);
    assertNoArbitraryColors(html, name);
  });

  // Group C: Layout
  it('(guarded)/layout.tsx has no raw palette classes', () => {
    const Layout = jest.requireActual('../(guarded)/layout').default;
    const { container } = render(<Layout><div>child</div></Layout>);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'layout');
    assertNoRawWhite(html, 'layout');
    assertNoArbitraryColors(html, 'layout');
  });

  // Group D: Data hook pages
  it('(guarded)/routes/page.tsx has no raw palette classes', () => {
    const RoutesPage = jest.requireActual('../(guarded)/routes/page').default;
    const { container } = render(<RoutesPage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'routes');
    assertNoRawWhite(html, 'routes');
    assertNoArbitraryColors(html, 'routes');
  });

  it('(guarded)/cash-prep/page.tsx has no raw palette classes', () => {
    const CashPrepPage = jest.requireActual('../(guarded)/cash-prep/page').default;
    const { container } = render(<CashPrepPage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'cash-prep');
    assertNoRawWhite(html, 'cash-prep');
    assertNoArbitraryColors(html, 'cash-prep');
  });

  it('(guarded)/eta/page.tsx has no raw palette classes', () => {
    const EtaPage = jest.requireActual('../(guarded)/eta/page').default;
    const { container } = render(<EtaPage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'eta');
    assertNoRawWhite(html, 'eta');
    assertNoArbitraryColors(html, 'eta');
  });

  // Group E: Server components (simple)
  it('error/page.tsx has no raw palette classes', async () => {
    const ErrorPage = (await import('../error/page')).default;
    const el = await ErrorPage();
    const { container } = render(el);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'error');
    assertNoRawWhite(html, 'error');
    assertNoArbitraryColors(html, 'error');
  });

  it('offline/page.tsx has no raw palette classes', async () => {
    const OfflinePage = (await import('../offline/page')).default;
    const el = await OfflinePage();
    const { container } = render(el);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'offline');
    assertNoRawWhite(html, 'offline');
    assertNoArbitraryColors(html, 'offline');
  });

  it('signage/find-my-stay-qr/page.tsx has no raw palette classes', async () => {
    const SignagePage = (await import('../signage/find-my-stay-qr/page')).default;
    const el = await SignagePage();
    const { container } = render(el);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'signage');
    assertNoRawWhite(html, 'signage');
    assertNoArbitraryColors(html, 'signage');
  });

  // Group F: Complex pages
  it('(guarded)/bag-storage/page.tsx has no raw palette classes', () => {
    const BagStoragePage = jest.requireActual('../(guarded)/bag-storage/page').default;
    const { container } = render(<BagStoragePage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'bag-storage');
    assertNoRawWhite(html, 'bag-storage');
    assertNoArbitraryColors(html, 'bag-storage');
  });

  it('(guarded)/digital-assistant/page.tsx has no raw palette classes', () => {
    const DigitalAssistantPage = jest.requireActual('../(guarded)/digital-assistant/page').default;
    const { container } = render(<DigitalAssistantPage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'digital-assistant');
    assertNoRawWhite(html, 'digital-assistant');
    assertNoArbitraryColors(html, 'digital-assistant');
  });

  it('(guarded)/chat/GuestDirectory.tsx has no raw palette classes', () => {
    const GuestDirectory = jest.requireActual('../(guarded)/chat/GuestDirectory').default;
    const { container } = render(<GuestDirectory />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'guest-directory');
    assertNoRawWhite(html, 'guest-directory');
    assertNoArbitraryColors(html, 'guest-directory');
  });

  it('find-my-stay/page.tsx has no raw palette classes', () => {
    const FindMyStayPage = jest.requireActual('../find-my-stay/page').default;
    const { container } = render(<FindMyStayPage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'find-my-stay');
    assertNoRawWhite(html, 'find-my-stay');
    assertNoArbitraryColors(html, 'find-my-stay');
  });

  it('admin/login/page.tsx has no raw palette classes', () => {
    const AdminLoginPage = jest.requireActual('../admin/login/page').default;
    const { container } = render(<AdminLoginPage />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'admin-login');
    assertNoRawWhite(html, 'admin-login');
    assertNoArbitraryColors(html, 'admin-login');
  });

  it('owner/setup/page.tsx has no raw palette classes', async () => {
    const OwnerSetupPage = (await import('../owner/setup/page')).default;
    const el = await OwnerSetupPage();
    const { container } = render(el);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'owner-setup');
    assertNoRawWhite(html, 'owner-setup');
    assertNoArbitraryColors(html, 'owner-setup');
  });

  it('portal/page.tsx has no raw palette classes', async () => {
    // Portal page's useEffect calls validateGuestToken which is async.
    // Mock returns token=null so it takes the "unavailable" path synchronously.
    const origMock = jest.requireMock('../../lib/auth/guestSessionGuard');
    origMock.readGuestSession.mockReturnValueOnce({ token: null });

    const PortalPage = jest.requireActual('../portal/page').default;
    let container: HTMLElement;
    await act(async () => {
      const result = render(<PortalPage />);
      container = result.container;
    });
    const html = container!.innerHTML;
    assertNoRawPaletteClasses(html, 'portal');
    assertNoRawWhite(html, 'portal');
    assertNoArbitraryColors(html, 'portal');
  });

  it('page.tsx (root) has no raw palette classes', async () => {
    const RootPage = jest.requireActual('../page').default;
    let container: HTMLElement;
    await act(async () => {
      const result = render(<RootPage />);
      container = result.container;
    });
    const html = container!.innerHTML;
    assertNoRawPaletteClasses(html, 'root');
    assertNoRawWhite(html, 'root');
    assertNoArbitraryColors(html, 'root');
  });

  it('admin/users/page.tsx has no raw palette classes', async () => {
    const AdminUsersPage = (await import('../admin/users/page')).default;
    const el = await AdminUsersPage();
    const { container } = render(el);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'admin-users');
    assertNoRawWhite(html, 'admin-users');
    assertNoArbitraryColors(html, 'admin-users');
  });
});
