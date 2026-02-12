import { fireEvent, render, screen } from '@testing-library/react';

import GuardedHomeExperience from '../../../components/homepage/GuardedHomeExperience';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';

const mockPush = jest.fn();
const mockUseCheckInCode = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: jest.fn(),
}));

jest.mock('../../../hooks/usePreArrivalState', () => ({
  usePreArrivalState: jest.fn(),
}));

jest.mock('../../../hooks/useCheckInCode', () => ({
  useCheckInCode: (args: unknown) => mockUseCheckInCode(args),
}));

jest.mock('../../../components/pre-arrival/ReadinessDashboard', () => ({
  __esModule: true,
  default: () => <div>readiness-dashboard</div>,
}));

jest.mock('../../../components/arrival/ArrivalHome', () => ({
  __esModule: true,
  default: ({ checkInCode, onChecklistItemClick }: any) => (
    <div>
      <div>{`arrival-home-${checkInCode ?? 'none'}`}</div>
      <button type="button" onClick={() => onChecklistItemClick('cashPrepared')}>
        open-cash
      </button>
    </div>
  ),
}));

jest.mock('../../../components/homepage/HomePage', () => ({
  __esModule: true,
  default: () => <div>legacy-home</div>,
}));

describe('Guarded home - arrival mode', () => {
  const mockedUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<typeof useUnifiedBookingData>;
  const mockedUsePreArrivalState = usePreArrivalState as jest.MockedFunction<typeof usePreArrivalState>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        firstName: 'Jane',
        checkInDate: '2026-02-07',
        checkOutDate: '2026-02-10',
        nights: 3,
        cityTax: { totalDue: 18 },
      } as any,
      occupantId: 'occ_1234567890123',
      isLoading: false,
      error: null,
      isInitialSyncComplete: true,
      dateInfo: { daysRemaining: null, daysUntilCheckIn: 0 },
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

    mockUseCheckInCode.mockReturnValue({
      code: 'BRK-ABCDE',
      isLoading: false,
      isError: false,
      errorMessage: null,
      generateCode: jest.fn(),
      refetch: jest.fn(),
    });
  });

  it('TC-01: renders arrival mode instead of readiness dashboard on arrival day', () => {
    render(<GuardedHomeExperience />);

    expect(screen.getByText('arrival-home-BRK-ABCDE')).toBeDefined();
    expect(screen.queryByText('readiness-dashboard')).toBeNull();
  });

  it('TC-04: enables auto-generation flow via useCheckInCode on arrival day', () => {
    render(<GuardedHomeExperience />);

    expect(mockUseCheckInCode).toHaveBeenCalledWith({
      checkOutDate: '2026-02-10',
      enabled: true,
    });
  });

  it('routes arrival cash reminder action to cash prep flow', () => {
    render(<GuardedHomeExperience />);

    fireEvent.click(screen.getByRole('button', { name: 'open-cash' }));
    expect(mockPush).toHaveBeenCalledWith('/cash-prep');
  });
});

describe('Guarded home - checked-in mode', () => {
  const mockedUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<typeof useUnifiedBookingData>;
  const mockedUsePreArrivalState = usePreArrivalState as jest.MockedFunction<typeof usePreArrivalState>;

  it('TC-05: shows legacy homepage when guest is checked in', () => {
    mockedUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        firstName: 'Jane',
        checkInDate: '2026-02-05',
        checkOutDate: '2026-02-10',
        nights: 5,
      } as any,
      occupantId: 'occ_1234567890123',
      isLoading: false,
      error: null,
      isInitialSyncComplete: true,
      dateInfo: { daysRemaining: 2, daysUntilCheckIn: null },
      upgradeInfo: null,
      isCheckedIn: true,
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

    mockUseCheckInCode.mockReturnValue({
      code: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
      generateCode: jest.fn(),
      refetch: jest.fn(),
    });

    render(<GuardedHomeExperience />);

    expect(screen.getByText('legacy-home')).toBeDefined();
  });
});
