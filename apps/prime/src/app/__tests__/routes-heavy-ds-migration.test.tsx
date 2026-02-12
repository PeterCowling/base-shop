/**
 * DS Migration Tests — Heavy Route Pages (TASK-08)
 *
 * Verifies that the 8 heaviest route page files have no raw Tailwind
 * palette classes after migration to semantic DS theme tokens.
 *
 * Test strategy: render each component with minimal mocks, then assert
 * the rendered DOM contains zero raw color classes.
 */

import { render } from '@testing-library/react';

// ── RAW PALETTE PATTERNS ────────────────────────────────────────────
const RAW_PALETTE = /(^|\s)(bg|text|border|ring|shadow|divide|placeholder|stroke|fill|from|to|via)-(gray|slate|blue|green|emerald|red|amber|yellow|orange|purple|indigo|teal|sky|cyan|violet|rose|lime|fuchsia|pink|white)-\d+/;
const RAW_WHITE = /(^|\s)(bg|text|border)-white(?:\s|"|$)/;
const ARBITRARY_HEX = /(bg|text|border)-\[#[0-9a-fA-F]+\]/;

function assertNoRawPaletteClasses(html: string, componentName: string) {
  const match = html.match(RAW_PALETTE);
  expect(match).toBeNull();
}

function assertNoRawWhite(html: string, componentName: string) {
  const match = html.match(RAW_WHITE);
  expect(match).toBeNull();
}

function assertNoArbitraryColors(html: string, componentName: string) {
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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/checkin/BRK-ABCDE',
  useSearchParams: () => new URLSearchParams('token=test-token&id=activity-1'),
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

// ── OWNER SCORECARD MOCKS ──────────────────────────────────────────

jest.mock('../../lib/owner/kpiReader', () => ({
  readKpiRange: jest.fn().mockResolvedValue([
    {
      date: '2026-02-01',
      guestCount: 10,
      readinessCompletionPct: 95,
      etaSubmissionPct: 90,
      arrivalCodeGenPct: 100,
      medianCheckInLagMinutes: 12,
      extensionRequestCount: 1,
      bagDropRequestCount: 0,
      updatedAt: Date.now(),
    },
    {
      date: '2026-02-02',
      guestCount: 8,
      readinessCompletionPct: 85,
      etaSubmissionPct: 88,
      arrivalCodeGenPct: 95,
      medianCheckInLagMinutes: 15,
      extensionRequestCount: 0,
      bagDropRequestCount: 1,
      updatedAt: Date.now(),
    },
    {
      date: '2026-02-03',
      guestCount: 12,
      readinessCompletionPct: 75,
      etaSubmissionPct: 82,
      arrivalCodeGenPct: 90,
      medianCheckInLagMinutes: 20,
      extensionRequestCount: 2,
      bagDropRequestCount: 0,
      updatedAt: Date.now(),
    },
  ]),
}));

jest.mock('../../lib/security/staffOwnerGate', () => ({
  canAccessStaffOwnerRoutes: jest.fn(() => true),
  getStaffOwnerGateMessage: jest.fn(() => 'Disabled'),
}));

jest.mock('../../components/security/StaffOwnerDisabledNotice', () => {
  return function MockNotice() {
    return <div data-testid="disabled-notice" />;
  };
});

// ── BOOKING DETAILS MOCKS ──────────────────────────────────────────

jest.mock('../../hooks/dataOrchestrator/useGuestBookingSnapshot', () => ({
  useGuestBookingSnapshot: jest.fn(() => ({
    snapshot: {
      bookingId: 'BOOK123',
      reservationCode: 'BOOK123',
      checkInDate: '2099-02-10',
      checkOutDate: '2099-02-12',
      roomAssignment: '3A',
      isCheckedIn: false,
      requestSummary: { extension: { status: 'pending' } },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    token: 'test-token',
  })),
}));

jest.mock('../../lib/preArrival/arrivalState', () => ({
  getGuestArrivalState: jest.fn(() => 'pre-arrival'),
}));

jest.mock('../../lib/security/guestCriticalFlowEndpoints', () => ({
  GUEST_CRITICAL_FLOW_ENDPOINTS: { extension_request: '/api/extension' },
}));

// ── ACTIVITIES MOCKS ───────────────────────────────────────────────

jest.mock('@/contexts/messaging/ChatProvider', () => ({
  useChat: jest.fn(() => ({
    activities: {
      'act-1': {
        id: 'act-1',
        title: 'Sunset Drinks',
        description: 'Join us at the bar',
        startTime: Date.now() + 3600000,
        status: 'upcoming',
        meetUpPoint: 'Rooftop',
      },
    },
    messages: {},
    hasMoreActivities: false,
    loadMoreActivities: jest.fn(),
    setCurrentChannelId: jest.fn(),
    sendMessage: jest.fn(),
  })),
}));

jest.mock('@/hooks/useUuid', () => ({
  __esModule: true,
  default: jest.fn(() => 'test-uuid'),
}));

jest.mock('@/lib/auth/guestSessionGuard', () => ({
  readGuestSession: jest.fn(() => ({ token: 'test-token', uuid: 'test-uuid' })),
}));

jest.mock('@/lib/security/dataAccessModel', () => ({
  evaluateSdkAccess: jest.fn(() => ({ allowed: true })),
  isSdkFlowFeatureEnabled: jest.fn(() => true),
}));

jest.mock('@/services/firebase', () => ({
  ref: jest.fn(),
  onValue: jest.fn(() => jest.fn()),
  off: jest.fn(),
  get: jest.fn().mockResolvedValue({ exists: () => false }),
  set: jest.fn(),
}));

jest.mock('@/services/useFirebase', () => ({
  useFirebaseDatabase: jest.fn(() => ({})),
}));

jest.mock('@/types/messenger/activity', () => ({}));
jest.mock('@/utils/messaging/dbRoot', () => ({ MSG_ROOT: 'msg' }));

// ── STAFF MOCKS ────────────────────────────────────────────────────

jest.mock('../../contexts/messaging/PinAuthProvider', () => ({
  usePinAuth: jest.fn(() => ({
    user: { id: 'staff-1' },
    role: 'staff',
    claims: { role: 'staff' },
    authToken: 'staff-token',
    isAuthenticated: true,
    isLoading: false,
    authError: null,
    lockout: null,
    login: jest.fn(async () => true),
    logout: jest.fn(),
  })),
}));

jest.mock('../../components/check-in/StaffReadinessBadges', () => {
  return function MockBadges() {
    return <div data-testid="readiness-badges" />;
  };
});

jest.mock('../../lib/checkin/helpers', () => ({
  extractCodeFromPathname: jest.fn(() => 'BRK-ABCDE'),
  formatEtaWindow: jest.fn(() => '14:00 - 16:00'),
  isStaffRole: jest.fn(() => true),
}));

jest.mock('../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

jest.mock('../../lib/owner/businessScorecard', () => ({
  computeBusinessScorecard: jest.fn(() => ({
    totalGuests: 30,
    daysWithData: 3,
    hasInsufficientData: false,
    metrics: {
      readiness: { formattedValue: '85%', status: 'success' },
      etaSubmission: { formattedValue: '87%', status: 'success' },
      codeGeneration: { formattedValue: '95%', status: 'success' },
      checkInLag: { formattedValue: '16 min', status: 'warning' },
      supportLoad: { formattedValue: '0.1', status: 'success' },
    },
    totalSupportRequests: 4,
    reviewActions: [],
  })),
  SCORECARD_TARGETS: {
    readiness: { metric: 'Guest Readiness', target: 80, unit: '%', description: 'test' },
    etaSubmission: { metric: 'ETA Submission', target: 80, unit: '%', description: 'test' },
    codeGeneration: { metric: 'Code Generation', target: 90, unit: '%', description: 'test' },
    checkInLag: { metric: 'Check-in Lag', target: 15, unit: ' min', description: 'test' },
    supportLoad: { metric: 'Support Load', target: 0.2, unit: '', description: 'test' },
  },
}));

// ── TESTS ───────────────────────────────────────────────────────────

describe('TASK-08: Heavy route pages — DS migration', () => {
  it('owner/scorecard/page.tsx has no raw palette classes', async () => {
    const ScorecardPage = (await import('../owner/scorecard/page')).default;
    const el = await ScorecardPage();
    const { container } = render(el);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'ScorecardPage');
    assertNoRawWhite(html, 'ScorecardPage');
    assertNoArbitraryColors(html, 'ScorecardPage');
  });

  it('owner/page.tsx has no raw palette classes', async () => {
    const OwnerPage = (await import('../owner/page')).default;
    const el = await OwnerPage();
    const { container } = render(el);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'OwnerPage');
    assertNoRawWhite(html, 'OwnerPage');
    assertNoArbitraryColors(html, 'OwnerPage');
  });

  it('(guarded)/booking-details/page.tsx has no raw palette classes', () => {
    const BookingDetailsPage =
      jest.requireActual('../(guarded)/booking-details/page').default;
    const { container } = render(<BookingDetailsPage />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'BookingDetailsPage');
    assertNoRawWhite(html, 'BookingDetailsPage');
    assertNoArbitraryColors(html, 'BookingDetailsPage');
  });

  it('(guarded)/activities/ActivitiesClient.tsx has no raw palette classes', () => {
    const ActivitiesClient =
      jest.requireActual('../(guarded)/activities/ActivitiesClient').default;
    const { container } = render(<ActivitiesClient />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'ActivitiesClient');
    assertNoRawWhite(html, 'ActivitiesClient');
    assertNoArbitraryColors(html, 'ActivitiesClient');
  });

  it('staff-lookup/StaffLookupClient.tsx has no raw palette classes', () => {
    const StaffLookupPage =
      jest.requireActual('../staff-lookup/StaffLookupClient').default;
    const { container } = render(<StaffLookupPage />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'StaffLookupClient');
    assertNoRawWhite(html, 'StaffLookupClient');
    assertNoArbitraryColors(html, 'StaffLookupClient');
  });

  it('checkin/CheckInClient.tsx has no raw palette classes', () => {
    const CheckInPage =
      jest.requireActual('../checkin/CheckInClient').default;
    const { container } = render(<CheckInPage />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'CheckInClient');
    assertNoRawWhite(html, 'CheckInClient');
    assertNoArbitraryColors(html, 'CheckInClient');
  });

  it('g/page.tsx has no raw palette classes', () => {
    const GuestEntryPage =
      jest.requireActual('../g/page').default;
    const { container } = render(<GuestEntryPage />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'GuestEntryPage');
    assertNoRawWhite(html, 'GuestEntryPage');
    assertNoArbitraryColors(html, 'GuestEntryPage');
  });

  it('(guarded)/chat/channel/page.tsx has no raw palette classes', () => {
    const ChannelPage =
      jest.requireActual('../(guarded)/chat/channel/page').default;
    const { container } = render(<ChannelPage />);
    const html = container.innerHTML;

    assertNoRawPaletteClasses(html, 'ChannelPage');
    assertNoRawWhite(html, 'ChannelPage');
    assertNoArbitraryColors(html, 'ChannelPage');
  });
});
