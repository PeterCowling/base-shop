import { render, screen } from '@testing-library/react';

import type { PreArrivalData } from '../../../types/preArrival';
import ReadinessDashboard from '../ReadinessDashboard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const makeData = (overrides: Partial<PreArrivalData['checklistProgress']> = {}): PreArrivalData => ({
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
    routePlanned: false,
    etaConfirmed: false,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
    ...overrides,
  },
  updatedAt: 0,
});

describe('ReadinessDashboard progress milestones', () => {
  it('TC-01: checklist completion increments visible milestone progress', () => {
    const { rerender } = render(
      <ReadinessDashboard
        preArrivalData={makeData()}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('0%')).toBeDefined();

    rerender(
      <ReadinessDashboard
        preArrivalData={makeData({ routePlanned: true })}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('25%')).toBeDefined();
  });

  it('TC-02 and TC-03: celebration UI triggers once per completion event without duplicate spam', () => {
    const { rerender } = render(
      <ReadinessDashboard
        preArrivalData={makeData({ routePlanned: true })}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
        recentlyCompletedItem="routePlanned"
      />,
    );

    expect(screen.getByText('Nice progress: Route planned completed.')).toBeDefined();

    rerender(
      <ReadinessDashboard
        preArrivalData={makeData({ routePlanned: true })}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
        recentlyCompletedItem="routePlanned"
      />,
    );

    expect(screen.getAllByText('Nice progress: Route planned completed.')).toHaveLength(1);
  });
});
