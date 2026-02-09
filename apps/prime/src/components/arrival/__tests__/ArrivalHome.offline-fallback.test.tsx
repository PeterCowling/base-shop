/**
 * ArrivalHome.offline-fallback.test.tsx
 *
 * Tests for offline fallback behavior in ArrivalHome component.
 */

import { render, screen } from '@testing-library/react';

import type { GuestKeycardStatus } from '../../../lib/preArrival/keycardStatus';
import type { ChecklistProgress,PreArrivalData } from '../../../types/preArrival';
import { ArrivalHome } from '../ArrivalHome';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      // Simple mock translations
      const translations: Record<string, string> = {
        'arrival.badge': 'Today is arrival day',
        'arrival.welcome': `Welcome ${params?.name || 'Guest'}`,
        'arrival.subtitle': "You're almost there!",
        'arrival.showAtReception': 'Show this at reception',
        'arrival.generatingCode': 'Generating code...',
        'arrival.codeUnavailable': 'Code unavailable',
        'arrival.codeStaleWarning': 'This code was cached. It may be outdated.',
        'arrival.offlineNoCache': 'Code unavailable offline',
        'arrival.refreshCode': 'Refresh Code',
        'arrival.cashReady': 'Cash ready',
        'arrival.cashReminder': 'Prepare cash',
        'arrival.cashAmount': `€${params?.amount}`,
        'arrival.cityTaxLabel': `City tax: €${params?.amount}`,
        'arrival.depositLabel': `Deposit: €${params?.amount}`,
        'arrival.idReminder': 'Bring your ID',
        'arrival.idNote': 'Passport or national ID',
        'arrival.findUs': 'Find us',
        'arrival.whatHappensNext': 'What happens next',
        'arrival.step1': 'Show code at reception',
        'arrival.step2': 'Pay city tax and deposit',
        'arrival.step3': 'Receive your keycard',
        'arrival.step4': 'Enjoy your stay',
        'location.address': '123 Test Street',
        'stay.night': 'night',
        'stay.nights': 'nights',
        'stay.location': 'Test Location',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock analytics
jest.mock('../../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

const mockPreArrivalData: PreArrivalData = {
  checklistProgress: {
    cashPrepared: false,
    locationSaved: false,
    etaShared: false,
    parkingBooked: false,
    idReady: false,
  },
  hasCompletedPreArrival: false,
  preArrivalScore: 40,
};

const mockKeycardStatus: GuestKeycardStatus = {
  state: 'pending-issue',
  hasLostCardNotice: false,
  latestTransactionType: null,
  latestTransactionAt: null,
};

describe('ArrivalHome offline fallback', () => {
  const defaultProps = {
    firstName: 'John',
    checkInCode: 'BRK-A7K9M',
    isCodeLoading: false,
    preArrivalData: mockPreArrivalData,
    cashAmounts: {
      cityTax: 10,
      deposit: 50,
    },
    nights: 3,
    onChecklistItemClick: jest.fn(),
    keycardStatus: mockKeycardStatus,
  };

  describe('TC-02: Offline state with cached code shows stale warning', () => {
    it('should render cached code with stale warning when offline', () => {
      const propsWithStale = {
        ...defaultProps,
        checkInCode: 'BRK-CACHED',
        isOffline: true,
        isCodeStale: true,
      };

      render(<ArrivalHome {...propsWithStale} />);

      // Code should be rendered
      expect(screen.getByText(/Show this at reception/i)).toBeInTheDocument();

      // Stale warning should be visible
      expect(screen.getByText(/This code was cached. It may be outdated./i)).toBeInTheDocument();
    });

    it('should show "Code unavailable offline" when offline with no cache', () => {
      const propsWithNoCache = {
        ...defaultProps,
        checkInCode: null,
        isOffline: true,
        isCodeStale: false,
      };

      render(<ArrivalHome {...propsWithNoCache} />);

      // Should show offline unavailable message
      expect(screen.getByText(/Code unavailable offline/i)).toBeInTheDocument();
    });
  });

  describe('TC-03: Refresh button appears when connectivity returns', () => {
    it('should show refresh button when back online with stale code', () => {
      const propsBackOnline = {
        ...defaultProps,
        checkInCode: 'BRK-CACHED',
        isOffline: false,
        isCodeStale: true,
        onRefreshCode: jest.fn(),
      };

      render(<ArrivalHome {...propsBackOnline} />);

      // Refresh button should be visible
      const refreshButton = screen.getByText(/Refresh Code/i);
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call onRefreshCode when refresh button is clicked', () => {
      const mockRefresh = jest.fn();
      const propsBackOnline = {
        ...defaultProps,
        checkInCode: 'BRK-CACHED',
        isOffline: false,
        isCodeStale: true,
        onRefreshCode: mockRefresh,
      };

      render(<ArrivalHome {...propsBackOnline} />);

      const refreshButton = screen.getByText(/Refresh Code/i);
      refreshButton.click();

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should not show refresh button when online with fresh code', () => {
      const propsWithFreshCode = {
        ...defaultProps,
        checkInCode: 'BRK-FRESH',
        isOffline: false,
        isCodeStale: false,
      };

      render(<ArrivalHome {...propsWithFreshCode} />);

      // Refresh button should NOT be visible
      expect(screen.queryByText(/Refresh Code/i)).not.toBeInTheDocument();

      // Stale warning should NOT be visible
      expect(screen.queryByText(/This code was cached/i)).not.toBeInTheDocument();
    });
  });
});
