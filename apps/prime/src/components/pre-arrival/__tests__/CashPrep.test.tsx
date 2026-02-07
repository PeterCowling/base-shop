import { fireEvent, render, screen } from '@testing-library/react';
import ArrivalHome from '../../arrival/ArrivalHome';
import CashPrep from '../CashPrep';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'arrival.cashAmount' && options?.amount !== undefined) {
        return `arrival.cashAmount.${options.amount}`;
      }
      if (key === 'arrival.cityTaxLabel' && options?.amount !== undefined) {
        return `arrival.cityTaxLabel.${options.amount}`;
      }
      if (key === 'arrival.depositLabel' && options?.amount !== undefined) {
        return `arrival.depositLabel.${options.amount}`;
      }
      return key;
    },
  }),
}));

jest.mock('../../check-in/CheckInQR', () => ({
  CheckInQR: ({ code }: { code: string }) => <div>{`checkin-qr-${code}`}</div>,
}));

describe('CashPrep', () => {
  it('TC-01: renders city tax + deposit amounts', () => {
    render(
      <CashPrep
        cityTaxAmount={18}
        depositAmount={10}
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.getByText('€18.00')).toBeDefined();
    expect(screen.getByText('€10.00')).toBeDefined();
    expect(screen.getByText('€28.00')).toBeDefined();
  });

  it('TC-02: confirm returns current readiness toggles', () => {
    const onConfirm = jest.fn();
    render(
      <CashPrep
        cityTaxAmount={18}
        depositAmount={10}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByLabelText('cash.confirm.cityTax'));
    fireEvent.click(screen.getByLabelText('cash.confirm.deposit'));
    fireEvent.click(screen.getByRole('button', { name: 'cash.done' }));

    expect(onConfirm).toHaveBeenCalledWith(true, true);
  });

  it('TC-03: arrival screen shows the same cash summary amounts', () => {
    render(
      <ArrivalHome
        firstName="Jane"
        checkInCode="BRK-ABCDE"
        isCodeLoading={false}
        preArrivalData={{
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
        }}
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        nights={3}
        onChecklistItemClick={jest.fn()}
      />,
    );

    expect(screen.getByText('arrival.cashAmount.28')).toBeDefined();
    expect(screen.getByText('arrival.cityTaxLabel.18')).toBeDefined();
    expect(screen.getByText('arrival.depositLabel.10')).toBeDefined();
  });
});
