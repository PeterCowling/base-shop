import { render, screen } from '@testing-library/react';

import type { PreArrivalData } from '../../../types/preArrival';
import ArrivalHome from '../ArrivalHome';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (typeof options?.amount === 'number') {
        return `${key}.${options.amount}`;
      }
      if (typeof options?.name === 'string') {
        return `${key}.${options.name}`;
      }
      return key;
    },
  }),
}));

const preArrivalData: PreArrivalData = {
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
    rulesReviewed: true,
    locationSaved: false,
  },
  updatedAt: 0,
};

describe('ArrivalHome semantic token usage', () => {
  it('TC-03: arrival/readiness surfaces expose hospitality token hooks', () => {
    const { container } = render(
      <ArrivalHome
        firstName="Jane"
        checkInCode="BRK-123"
        isCodeLoading={false}
        preArrivalData={preArrivalData}
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        nights={3}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(container.querySelector('[data-token="hospitality-arrival-panel"]')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Quick actions' })).toBeInTheDocument();
  });
});
