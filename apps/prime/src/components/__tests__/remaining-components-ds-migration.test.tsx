import { render, waitFor } from '@testing-library/react';

jest.setTimeout(15_000);

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>) =>
      typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key,
    i18n: { language: 'en' },
  }),
}));

// Mock lucide-react
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

// Mock @acme/design-system
jest.mock('@acme/design-system/primitives', () => ({
  Button: (props: any) => <button {...props} />,
}));

// Mock @acme/ui
jest.mock('@acme/ui', () => ({
  StaffSignalBadgeGroup: (props: any) => <div data-testid="signal-badges" {...props} />,
}));

// Mock PWA hooks
jest.mock('../../lib/pwa', () => ({
  useServiceWorker: jest.fn(() => ({
    updateAvailable: true,
    applyUpdate: jest.fn(),
    getStorageSize: jest.fn(() => Promise.resolve(1024)),
    clearCache: jest.fn(() => Promise.resolve()),
  })),
  useOnlineStatus: jest.fn(() => false), // offline to render the indicator
}));

// Mock guest booking snapshot
jest.mock('../../hooks/dataOrchestrator/useGuestBookingSnapshot', () => ({
  useGuestBookingSnapshot: jest.fn(() => ({
    snapshot: {
      bookingId: 'BOOK123',
      reservationCode: 'BOOK123',
      checkInDate: '2099-02-10',
      checkOutDate: '2099-02-12',
      roomAssignment: '3A',
      isCheckedIn: false,
      requestSummary: {},
      preorders: {},
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    token: 'test-token',
  })),
}));

// Mock guest critical flow endpoints
jest.mock('../../lib/security/guestCriticalFlowEndpoints', () => ({
  GUEST_CRITICAL_FLOW_ENDPOINTS: { meal_order: '/api/meal-order' },
}));

// Mock unified booking data
jest.mock('../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: jest.fn(() => ({
    data: { booking: { checkInDate: '2099-02-10' } },
    occupantData: { completedTasks: {} },
    isLoading: false,
  })),
}));

// Mock completed task mutator
jest.mock('../../hooks/mutator/useCompletedTaskMutator', () => ({
  useCompletedTaskMutator: jest.fn(() => ({
    completeTask: jest.fn(),
    markTaskCompleted: jest.fn(),
  })),
}));

// Mock guest profile mutator
jest.mock('../../hooks/mutator/useGuestProfileMutator', () => ({
  useGuestProfileMutator: jest.fn(() => ({
    updateProfile: jest.fn(() => Promise.resolve()),
    isUpdating: false,
  })),
}));

// Mock analytics
jest.mock('../../lib/analytics/activationFunnel', () => ({
  readActivationFunnelEvents: jest.fn(() => []),
  aggregateActivationFunnel: jest.fn(() => ({
    counts: {
      lookup_success: 10,
      verify_success: 8,
      guided_step_complete: 5,
      arrival_mode_entered: 4,
      utility_action_used: 3,
    },
    conversion: {
      lookupToVerify: 0.8,
      verifyToReadiness: 0.625,
      lookupToReadiness: 0.5,
    },
    trends: { weekly: [] },
  })),
  recordActivationFunnelEvent: jest.fn(),
}));

// Mock security
jest.mock('../../lib/security/staffOwnerGate', () => ({
  getStaffOwnerGateMessage: jest.fn(() => 'Feature is currently disabled.'),
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Pattern detection for raw palette classes (amber-*, blue-*, etc.)
const RAW_PALETTE =
  /class="[^"]*\b(amber|blue|cyan|emerald|fuchsia|gray|green|indigo|lime|neutral|orange|pink|purple|red|rose|sky|slate|stone|teal|violet|yellow|zinc)-\d{2,3}\b/;

// Pattern detection for raw white usage
const RAW_WHITE = /class="[^"]*\bwhite\b/;

// Pattern detection for arbitrary hex colors
const ARBITRARY_HEX = /class="[^"]*\[[#][0-9A-Fa-f]{3,8}\]/;

function assertNoRawPaletteClasses(html: string, componentName: string) {
  const match = html.match(RAW_PALETTE);
  if (match) {
    throw new Error(
      `${componentName} contains raw Tailwind palette classes: ${match[0]}`
    );
  }
}

function assertNoRawWhite(html: string, componentName: string) {
  const match = html.match(RAW_WHITE);
  if (match) {
    throw new Error(`${componentName} contains raw "white" class: ${match[0]}`);
  }
}

function assertNoArbitraryColors(html: string, componentName: string) {
  const match = html.match(ARBITRARY_HEX);
  if (match) {
    throw new Error(
      `${componentName} contains arbitrary hex color classes: ${match[0]}`
    );
  }
}

describe('TASK-13: Remaining components — DS migration', () => {
  it('MealOrderPage has no raw palette classes', () => {
    const MealOrderPage = jest.requireActual('../meal-orders/MealOrderPage').default;
    const { container } = render(
      <MealOrderPage service="breakfast" title="Test Meal" iconClassName="text-warning-foreground" />
    );
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'MealOrderPage');
    assertNoRawWhite(html, 'MealOrderPage');
    assertNoArbitraryColors(html, 'MealOrderPage');
  });

  it('FindMyStay has no raw palette classes', () => {
    const FindMyStay = jest.requireActual('../auth/FindMyStay').default;
    const { container } = render(<FindMyStay />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'FindMyStay');
    assertNoRawWhite(html, 'FindMyStay');
    assertNoArbitraryColors(html, 'FindMyStay');
  });

  it('CacheSettings has no raw palette classes', () => {
    const { CacheSettings } = jest.requireActual('../pwa/CacheSettings');
    const { container } = render(<CacheSettings />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'CacheSettings');
    assertNoRawWhite(html, 'CacheSettings');
    assertNoArbitraryColors(html, 'CacheSettings');
  });

  it('PositanoGuide has no raw palette classes', () => {
    const PositanoGuide = jest.requireActual('../positano-guide/PositanoGuide').default;
    const { container } = render(<PositanoGuide />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'PositanoGuide');
    assertNoRawWhite(html, 'PositanoGuide');
    assertNoArbitraryColors(html, 'PositanoGuide');
  });

  it('ActivationFunnelSummary has no raw palette classes', () => {
    const ActivationFunnelSummary = jest.requireActual('../owner/ActivationFunnelSummary').default;
    const { container } = render(<ActivationFunnelSummary />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'ActivationFunnelSummary');
    assertNoRawWhite(html, 'ActivationFunnelSummary');
    assertNoArbitraryColors(html, 'ActivationFunnelSummary');
  });

  it('CheckInQR has no raw palette classes', async () => {
    const CheckInQR = jest.requireActual('../check-in/CheckInQR').default;
    const { container } = render(<CheckInQR code="BRK-ABCDE" />);
    await waitFor(() => {
      expect(container.querySelector('img')).toBeTruthy();
    });
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'CheckInQR');
    assertNoRawWhite(html, 'CheckInQR');
    assertNoArbitraryColors(html, 'CheckInQR');
  });

  it('ChatOptInControls has no raw palette classes', () => {
    const ChatOptInControls = jest.requireActual('../settings/ChatOptInControls').default;
    const { container } = render(
      <ChatOptInControls
        profile={{ chatOptIn: true, uuid: 'test', displayName: 'Test' } as any}
      />
    );
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'ChatOptInControls');
    assertNoRawWhite(html, 'ChatOptInControls');
    assertNoArbitraryColors(html, 'ChatOptInControls');
  });

  it('UpdatePrompt has no raw palette classes', () => {
    const { UpdatePrompt } = jest.requireActual('../pwa/UpdatePrompt');
    const { container } = render(<UpdatePrompt />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'UpdatePrompt');
    assertNoRawWhite(html, 'UpdatePrompt');
    assertNoArbitraryColors(html, 'UpdatePrompt');
  });

  it('StaffReadinessBadges has no raw palette classes', () => {
    const StaffReadinessBadges = jest.requireActual('../check-in/StaffReadinessBadges').default;
    const { container } = render(
      <StaffReadinessBadges
        readiness={{
          readinessScore: 80,
          etaConfirmed: true,
          cashPrepared: false,
          routePlanned: true,
          rulesReviewed: false,
          locationSaved: true
        }}
        personalization={{
          arrivalMethodPreference: 'bus',
          arrivalConfidence: 'high'
        }}
        operational={{
          bagDropRequested: true
        }}
      />
    );
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'StaffReadinessBadges');
    assertNoRawWhite(html, 'StaffReadinessBadges');
    assertNoArbitraryColors(html, 'StaffReadinessBadges');
  });

  it('StaffOwnerDisabledNotice has no raw palette classes', () => {
    const StaffOwnerDisabledNotice = jest.requireActual('../security/StaffOwnerDisabledNotice').default;
    const { container } = render(<StaffOwnerDisabledNotice />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'StaffOwnerDisabledNotice');
    assertNoRawWhite(html, 'StaffOwnerDisabledNotice');
    assertNoArbitraryColors(html, 'StaffOwnerDisabledNotice');
  });

  it('ProfileCompletionBanner has no raw palette classes', () => {
    const { ProfileCompletionBanner } = jest.requireActual('../profile/ProfileCompletionBanner');
    const { container } = render(
      <ProfileCompletionBanner isStale={false} profileStatus="partial" />
    );
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'ProfileCompletionBanner');
    assertNoRawWhite(html, 'ProfileCompletionBanner');
    assertNoArbitraryColors(html, 'ProfileCompletionBanner');
  });

  it('OfflineIndicator has no raw palette classes', () => {
    const { OfflineIndicator } = jest.requireActual('../pwa/OfflineIndicator');
    const { container } = render(<OfflineIndicator />);
    const html = container.innerHTML;
    assertNoRawPaletteClasses(html, 'OfflineIndicator');
    assertNoRawWhite(html, 'OfflineIndicator');
    assertNoArbitraryColors(html, 'OfflineIndicator');
  });
});
