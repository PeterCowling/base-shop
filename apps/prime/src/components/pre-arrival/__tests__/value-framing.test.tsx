import { render, screen } from '@testing-library/react';

import type { PreArrivalData } from '../../../types/preArrival';
import ReadinessDashboard from '../ReadinessDashboard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const baseData: PreArrivalData = {
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
    cashPrepared: true,
    rulesReviewed: true,
    locationSaved: true,
  },
  updatedAt: 0,
};

describe('ReadinessDashboard value framing', () => {
  it('TC-02: value framing copy updates correctly by arrival state', () => {
    const { rerender } = render(
      <ReadinessDashboard
        preArrivalData={baseData}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('Complete these steps now to speed up check-in on arrival day.')).toBeDefined();

    rerender(
      <ReadinessDashboard
        preArrivalData={baseData}
        arrivalState="arrival-day"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('Final checks now mean faster reception handoff.')).toBeDefined();
  });

  it('TC-03: confidence cue renders when guest is highly ready', () => {
    render(
      <ReadinessDashboard
        preArrivalData={baseData}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('You are ready for arrival')).toBeDefined();
  });
});
