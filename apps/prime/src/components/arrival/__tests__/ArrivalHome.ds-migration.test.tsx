import { render } from '@testing-library/react';

import type { PreArrivalData } from '../../../types/preArrival';
import ArrivalHome from '../ArrivalHome';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (typeof options?.amount === 'number') return `${key}.${options.amount}`;
      if (typeof options?.name === 'string') return `${key}.${options.name}`;
      return key;
    },
  }),
}));

jest.mock('@acme/ui', () => ({
  ArrivalCodePanel: ({ title }: { title: string }) => (
    <div data-testid="arrival-code-panel">{title}</div>
  ),
  UtilityActionStrip: () => <div data-testid="utility-strip" />,
}));

jest.mock('../../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

jest.mock('../../check-in/CheckInQR', () => ({
  CheckInQR: () => <div data-testid="check-in-qr" />,
}));

const basePreArrivalData: PreArrivalData = {
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

const defaultProps = {
  firstName: 'Jane',
  checkInCode: 'BRK-123',
  isCodeLoading: false,
  preArrivalData: basePreArrivalData,
  cashAmounts: { cityTax: 18, deposit: 10 },
  nights: 3,
  onChecklistItemClick: jest.fn(),
};

describe('ArrivalHome DS Migration', () => {
  // TC-01: No raw green palette classes when cashReady=true
  it('should use semantic success tokens instead of raw green classes', () => {
    const readyData = {
      ...basePreArrivalData,
      checklistProgress: { ...basePreArrivalData.checklistProgress, cashPrepared: true },
    };
    const { container } = render(
      <ArrivalHome {...defaultProps} preArrivalData={readyData} />,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-green-/);
    expect(html).not.toMatch(/\btext-green-/);
  });

  // TC-02: No raw amber palette classes when cashReady=false
  it('should use semantic warning tokens instead of raw amber classes', () => {
    const { container } = render(<ArrivalHome {...defaultProps} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-amber-/);
    expect(html).not.toMatch(/\btext-amber-/);
  });

  // TC-03: No raw blue palette classes
  it('should use semantic info/primary tokens instead of raw blue classes', () => {
    const { container } = render(<ArrivalHome {...defaultProps} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-blue-/);
    expect(html).not.toMatch(/\btext-blue-/);
  });

  // TC-04: No raw gray palette classes
  it('should use semantic foreground/muted tokens instead of raw gray classes', () => {
    const { container } = render(<ArrivalHome {...defaultProps} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\btext-gray-/);
    expect(html).not.toMatch(/\bbg-gray-/);
  });

  // TC-05: No raw red palette classes in error state
  it('should use semantic danger tokens instead of raw red classes', () => {
    const { container } = render(
      <ArrivalHome {...defaultProps} isOffline={true} checkInCode={null} />,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-red-/);
    expect(html).not.toMatch(/\btext-red-/);
  });
});
