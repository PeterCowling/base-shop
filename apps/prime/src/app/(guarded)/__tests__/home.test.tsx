import { fireEvent, render, screen } from '@testing-library/react';
import GuardedHomeExperience from '../../../components/homepage/GuardedHomeExperience';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';

const mockPush = jest.fn();
const mockUpdateChecklistItem = jest.fn();

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
  useCheckInCode: jest.fn(() => ({
    code: null,
    isLoading: false,
    isError: false,
    errorMessage: null,
    generateCode: jest.fn(),
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../components/pre-arrival/ReadinessDashboard', () => ({
  __esModule: true,
  default: ({ cashAmounts, onChecklistItemClick }: any) => (
    <div>
      <div>readiness-dashboard</div>
      <div>{`cash-${cashAmounts.cityTax}-${cashAmounts.deposit}`}</div>
      <button type="button" onClick={() => onChecklistItemClick('routePlanned')}>
        open-routes
      </button>
      <button type="button" onClick={() => onChecklistItemClick('rulesReviewed')}>
        toggle-rules
      </button>
    </div>
  ),
}));

jest.mock('../../../components/arrival/ArrivalHome', () => ({
  __esModule: true,
  default: () => <div>arrival-home</div>,
}));

jest.mock('../../../components/homepage/HomePage', () => ({
  __esModule: true,
  default: () => <div>legacy-home</div>,
}));

describe('Guarded home - pre-arrival readiness mode', () => {
  const mockedUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<typeof useUnifiedBookingData>;
  const mockedUsePreArrivalState = usePreArrivalState as jest.MockedFunction<typeof usePreArrivalState>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        firstName: 'Jane',
        checkInDate: '2099-12-30',
        checkOutDate: '2100-01-02',
        nights: 3,
        cityTax: { totalDue: 18 },
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
      updateChecklistItem: mockUpdateChecklistItem,
      setEta: jest.fn(),
      setCashReady: jest.fn(),
      saveRoute: jest.fn(),
      refetch: jest.fn(),
    });
  });

  it('TC-01: renders readiness dashboard for pre-arrival guests', () => {
    render(<GuardedHomeExperience />);

    expect(screen.getByText('readiness-dashboard')).toBeDefined();
    expect(screen.getByText('legacy-home')).toBeDefined();
  });

  it('TC-03: checklist interactions route correctly and update local checklist actions', () => {
    render(<GuardedHomeExperience />);

    fireEvent.click(screen.getByRole('button', { name: 'open-routes' }));
    expect(mockPush).toHaveBeenCalledWith('/routes');

    fireEvent.click(screen.getByRole('button', { name: 'toggle-rules' }));
    expect(mockUpdateChecklistItem).toHaveBeenCalledWith('rulesReviewed', true);
  });

  it('TC-04: readiness mode passes correct cash amounts for display', () => {
    render(<GuardedHomeExperience />);

    expect(screen.getByText('cash-18-10')).toBeDefined();
  });
});
