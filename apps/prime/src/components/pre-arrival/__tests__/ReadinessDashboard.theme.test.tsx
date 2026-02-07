import { render, screen } from '@testing-library/react';
import ReadinessDashboard from '../ReadinessDashboard';
import type { PreArrivalData } from '../../../types/preArrival';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const data: PreArrivalData = {
  etaWindow: null,
  etaMethod: null,
  etaNote: '',
  etaConfirmedAt: null,
  cashReadyCityTax: false,
  cashReadyDeposit: false,
  routeSaved: null,
  arrivalMethodPreference: null,
  arrivalConfidence: null,
  checklistProgress: {
    routePlanned: true,
    etaConfirmed: true,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
  },
  updatedAt: 0,
};

describe('ReadinessDashboard theme smoke', () => {
  afterEach(() => {
    document.documentElement.classList.remove('theme-dark');
  });

  it('TC-03: renders consistently in light and dark theme class modes', () => {
    const { rerender } = render(
      <ReadinessDashboard
        preArrivalData={data}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('header.welcome')).toBeInTheDocument();
    expect(screen.getByText(/items complete/i)).toBeInTheDocument();

    document.documentElement.classList.add('theme-dark');
    rerender(
      <ReadinessDashboard
        preArrivalData={data}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('header.welcome')).toBeInTheDocument();
    expect(screen.getByText(/items complete/i)).toBeInTheDocument();
  });
});
