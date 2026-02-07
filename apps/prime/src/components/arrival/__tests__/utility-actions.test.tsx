import { fireEvent, render, screen } from '@testing-library/react';
import { ReadinessDashboard } from '../../pre-arrival/ReadinessDashboard';
import ArrivalHome from '../ArrivalHome';
import { recordActivationFunnelEvent } from '../../../lib/analytics/activationFunnel';
import type { PreArrivalData } from '../../../types/preArrival';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params && typeof params.name === 'string') {
        return `${key}:${params.name}`;
      }
      return key;
    },
  }),
}));

jest.mock('../../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

jest.mock('../../check-in/CheckInQR', () => ({
  CheckInQR: ({ code }: { code: string }) => <div>{`qr-${code}`}</div>,
}));

jest.mock('../KeycardStatus', () => ({
  __esModule: true,
  default: () => <div>keycard-status</div>,
}));

jest.mock('@acme/ui', () => ({
  ReadinessSignalCard: () => <div>readiness-card</div>,
  ArrivalCodePanel: ({ renderCode, code }: { renderCode: (value: string) => JSX.Element; code: string | null }) => (
    <div>{code ? renderCode(code) : 'no-code'}</div>
  ),
  UtilityActionStrip: ({ actions }: { actions: Array<{ id: string; label: string; onSelect: () => void }> }) => (
    <div>
      {actions.map((action) => (
        <button key={action.id} type="button" onClick={action.onSelect}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

const defaultPreArrivalData: PreArrivalData = {
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
  updatedAt: Date.now(),
};

describe('utility action surfaces', () => {
  const mockedRecord = recordActivationFunnelEvent as jest.MockedFunction<typeof recordActivationFunnelEvent>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('prime_guest_uuid', 'occ_1234567890123');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TC-01: renders contextual action set for pre-arrival vs arrival-day', () => {
    const noop = jest.fn();

    const { unmount } = render(
      <ReadinessDashboard
        preArrivalData={defaultPreArrivalData}
        arrivalState="pre-arrival"
        checkInDate="2026-02-10"
        nights={3}
        firstName="Jamie"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={noop}
      />,
    );

    expect(screen.getByRole('button', { name: 'Maps' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share ETA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Support' })).toBeInTheDocument();

    unmount();

    render(
      <ArrivalHome
        firstName="Jamie"
        checkInCode="BRK-ABCDE"
        isCodeLoading={false}
        preArrivalData={defaultPreArrivalData}
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        nights={3}
        onChecklistItemClick={noop}
      />,
    );

    expect(screen.getByRole('button', { name: 'Maps' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cash' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Support' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share ETA' })).toBeNull();
  });

  it('TC-02: action handlers invoke expected deep-link actions', () => {
    const checklistClick = jest.fn();
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ReadinessDashboard
        preArrivalData={defaultPreArrivalData}
        arrivalState="pre-arrival"
        checkInDate="2026-02-10"
        nights={3}
        firstName="Jamie"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={checklistClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Maps' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share ETA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Support' }));

    expect(checklistClick).toHaveBeenCalledWith('locationSaved');
    expect(checklistClick).toHaveBeenCalledWith('etaConfirmed');
    expect(openSpy).toHaveBeenCalledWith('mailto:hostelbrikette@gmail.com', '_self');
    expect(mockedRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'utility_action_used',
        stepId: 'support',
      }),
    );
  });

  it('TC-03: support action emits analytics with stable session key', () => {
    const checklistClick = jest.fn();
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ArrivalHome
        firstName="Jamie"
        checkInCode="BRK-ABCDE"
        isCodeLoading={false}
        preArrivalData={defaultPreArrivalData}
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        nights={3}
        onChecklistItemClick={checklistClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Support' }));

    expect(openSpy).toHaveBeenCalledWith('mailto:hostelbrikette@gmail.com', '_self');
    expect(mockedRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'utility_action_used',
        sessionKey: 'occ_1234567890123',
        stepId: 'support',
      }),
    );
  });
});
