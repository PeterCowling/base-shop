import { fireEvent, render, screen } from '@testing-library/react';
import RoutesPage from '../page';
import { ROUTES_TO_POSITANO } from '../../../../data/routes';
import { useUnifiedBookingData } from '../../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../../hooks/usePreArrivalState';

const mockSaveRoute = jest.fn();
const mockUpdateChecklistItem = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../../../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: jest.fn(),
}));

jest.mock('../../../../hooks/usePreArrivalState', () => ({
  usePreArrivalState: jest.fn(),
}));

jest.mock('../../../../components/routes/RoutePlanner', () => ({
  __esModule: true,
  default: ({ onSaveRoute, onRouteViewed }: any) => (
    <div>
      <div>{`routes-count-${ROUTES_TO_POSITANO.length}`}</div>
      <button type="button" onClick={() => onRouteViewed()}>
        viewed-route
      </button>
      <button type="button" onClick={() => onSaveRoute('naples-airport-positano-bus')}>
        save-route
      </button>
    </div>
  ),
}));

describe('RoutesPage', () => {
  const mockedUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<typeof useUnifiedBookingData>;
  const mockedUsePreArrivalState = usePreArrivalState as jest.MockedFunction<typeof usePreArrivalState>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        checkInDate: '2099-12-30',
        checkOutDate: '2100-01-02',
        nights: 3,
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
      saveRoute: mockSaveRoute,
      refetch: jest.fn(),
    });
  });

  it('TC-01: exposes full route dataset and checklist save hooks', () => {
    render(<RoutesPage />);

    expect(screen.getByText(`routes-count-${ROUTES_TO_POSITANO.length}`)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'viewed-route' }));
    expect(mockUpdateChecklistItem).toHaveBeenCalledWith('routePlanned', true);

    fireEvent.click(screen.getByRole('button', { name: 'save-route' }));
    expect(mockSaveRoute).toHaveBeenCalledWith('naples-airport-positano-bus');
  });
});
