import { render, screen } from '@testing-library/react';

import GuardedHomeExperience from '../../../components/homepage/GuardedHomeExperience';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: jest.fn(),
}));

jest.mock('../../../hooks/usePreArrivalState', () => ({
  usePreArrivalState: jest.fn(),
}));

jest.mock('../../../hooks/useCheckInCode', () => ({
  useCheckInCode: () => ({
    code: 'BRK-ABCDE',
    isLoading: false,
    isError: false,
    errorMessage: null,
    generateCode: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../components/pre-arrival/ReadinessDashboard', () => ({
  __esModule: true,
  default: () => <section data-testid="readiness-primary">readiness-primary</section>,
}));

jest.mock('../../../components/arrival/ArrivalHome', () => ({
  __esModule: true,
  default: () => <section data-testid="arrival-primary">arrival-primary</section>,
}));

jest.mock('../../../components/homepage/HomePage', () => ({
  __esModule: true,
  default: () => <section data-testid="legacy-secondary">legacy-secondary</section>,
}));

describe('Guarded home information architecture', () => {
  const mockedUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<typeof useUnifiedBookingData>;
  const mockedUsePreArrivalState = usePreArrivalState as jest.MockedFunction<typeof usePreArrivalState>;

  beforeEach(() => {
    mockedUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        firstName: 'Jane',
        checkInDate: '2099-12-30',
        checkOutDate: '2100-01-02',
        nights: 3,
        cityTax: { totalDue: 18 },
        loans: null,
      } as any,
      occupantId: 'occ_1234567890123',
      isLoading: false,
      error: null,
      isInitialSyncComplete: true,
      dateInfo: { daysRemaining: null, daysUntilCheckIn: 3 },
      upgradeInfo: null,
      isCheckedIn: false,
      prepaidMealPlans: [],
      showOrderBreakfastLink: false,
      showBreakfastIncludedMessage: false,
      drinksAllowed: 0,
      showOrderDrinkLinks: false,
      showDrinksIncludedMessage: false,
      localTimestamp: '',
      checkInDateDDMM: '',
      computedOrderDates: [],
      eligibility: {} as any,
      occupantBreakfastType: '',
      occupantDrink1Type: '',
      occupantDrink2Type: '',
      refetch: jest.fn(),
    });
  });

  it('TC-01: pre-arrival guests see readiness module as first/home-primary content', () => {
    mockedUsePreArrivalState.mockReturnValue({
      arrivalState: 'pre-arrival',
      showPreArrivalDashboard: true,
      preArrivalData: {
        etaWindow: null,
        etaMethod: null,
        etaNote: '',
        etaConfirmedAt: null,
        cashReadyCityTax: false,
        cashReadyDeposit: false,
        routeSaved: null,
        checklistProgress: {
          routePlanned: false,
          etaConfirmed: false,
          cashPrepared: false,
          rulesReviewed: false,
          locationSaved: false,
        },
        updatedAt: 0,
      },
      isLoading: false,
      cashAmounts: { cityTax: 18, deposit: 10 },
      updateChecklistItem: jest.fn(),
      setEta: jest.fn(),
      setCashReady: jest.fn(),
      saveRoute: jest.fn(),
      refetch: jest.fn(),
    });

    render(<GuardedHomeExperience />);

    const readiness = screen.getByText('readiness-primary');
    const legacy = screen.getByText('legacy-secondary');
    expect(readiness.compareDocumentPosition(legacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TC-02: arrival-day guests see arrival module as first/home-primary content', () => {
    mockedUsePreArrivalState.mockReturnValue({
      arrivalState: 'arrival-day',
      showPreArrivalDashboard: true,
      preArrivalData: {
        etaWindow: null,
        etaMethod: null,
        etaNote: '',
        etaConfirmedAt: null,
        cashReadyCityTax: false,
        cashReadyDeposit: false,
        routeSaved: null,
        checklistProgress: {
          routePlanned: false,
          etaConfirmed: false,
          cashPrepared: false,
          rulesReviewed: false,
          locationSaved: false,
        },
        updatedAt: 0,
      },
      isLoading: false,
      cashAmounts: { cityTax: 18, deposit: 10 },
      updateChecklistItem: jest.fn(),
      setEta: jest.fn(),
      setCashReady: jest.fn(),
      saveRoute: jest.fn(),
      refetch: jest.fn(),
    });

    render(<GuardedHomeExperience />);

    const arrival = screen.getByText('arrival-primary');
    const legacy = screen.getByText('legacy-secondary');
    expect(arrival.compareDocumentPosition(legacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TC-03: checked-in guests keep legacy homepage as primary view', () => {
    mockedUsePreArrivalState.mockReturnValue({
      arrivalState: 'checked-in',
      showPreArrivalDashboard: false,
      preArrivalData: {
        etaWindow: null,
        etaMethod: null,
        etaNote: '',
        etaConfirmedAt: null,
        cashReadyCityTax: false,
        cashReadyDeposit: false,
        routeSaved: null,
        checklistProgress: {
          routePlanned: false,
          etaConfirmed: false,
          cashPrepared: false,
          rulesReviewed: false,
          locationSaved: false,
        },
        updatedAt: 0,
      },
      isLoading: false,
      cashAmounts: { cityTax: 0, deposit: 10 },
      updateChecklistItem: jest.fn(),
      setEta: jest.fn(),
      setCashReady: jest.fn(),
      saveRoute: jest.fn(),
      refetch: jest.fn(),
    });

    render(<GuardedHomeExperience />);

    expect(screen.getByText('legacy-secondary')).toBeDefined();
    expect(screen.queryByText('readiness-primary')).toBeNull();
    expect(screen.queryByText('arrival-primary')).toBeNull();
  });

  it('TC-04: secondary sections remain available alongside primary module states', () => {
    mockedUsePreArrivalState.mockReturnValue({
      arrivalState: 'pre-arrival',
      showPreArrivalDashboard: true,
      preArrivalData: {
        etaWindow: null,
        etaMethod: null,
        etaNote: '',
        etaConfirmedAt: null,
        cashReadyCityTax: false,
        cashReadyDeposit: false,
        routeSaved: null,
        checklistProgress: {
          routePlanned: false,
          etaConfirmed: false,
          cashPrepared: false,
          rulesReviewed: false,
          locationSaved: false,
        },
        updatedAt: 0,
      },
      isLoading: false,
      cashAmounts: { cityTax: 18, deposit: 10 },
      updateChecklistItem: jest.fn(),
      setEta: jest.fn(),
      setCashReady: jest.fn(),
      saveRoute: jest.fn(),
      refetch: jest.fn(),
    });

    render(<GuardedHomeExperience />);

    expect(screen.getByText('readiness-primary')).toBeDefined();
    expect(screen.getByText('legacy-secondary')).toBeDefined();
  });
});
