import { render } from '@testing-library/react';

import type { GuestKeycardStatus } from '../../../lib/preArrival/keycardStatus';
import KeycardStatus from '../KeycardStatus';

function renderWithStatus(status: GuestKeycardStatus) {
  return render(<KeycardStatus status={status} />);
}

describe('KeycardStatus DS Migration', () => {
  // TC-01: Issued state uses success tokens
  it('should use success tokens for issued state, not raw green', () => {
    const { container } = renderWithStatus({
      state: 'issued',
      hasLostCardNotice: false,
      latestTransactionType: 'loan',
      latestTransactionAt: '2026-02-07T09:00:00.000Z',
    });
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-green-/);
    expect(html).not.toMatch(/\btext-green-/);
    // Should use semantic tokens
    expect(html).toMatch(/\bbg-success-soft\b/);
    expect(html).toMatch(/\btext-success-foreground\b/);
  });

  // TC-02: Lost state uses warning tokens
  it('should use warning tokens for lost state, not raw amber', () => {
    const { container } = renderWithStatus({
      state: 'lost',
      hasLostCardNotice: true,
      latestTransactionType: 'no_card',
      latestTransactionAt: '2026-02-07T11:00:00.000Z',
    });
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-amber-/);
    expect(html).not.toMatch(/\btext-amber-/);
    expect(html).toMatch(/\bbg-warning-soft\b/);
    expect(html).toMatch(/\btext-warning-foreground\b/);
  });

  // TC-03: Pending state uses info tokens
  it('should use info tokens for pending state, not raw blue', () => {
    const { container } = renderWithStatus({
      state: 'pending-issue',
      hasLostCardNotice: false,
      latestTransactionType: null,
      latestTransactionAt: null,
    });
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bbg-blue-/);
    expect(html).not.toMatch(/\btext-blue-/);
    expect(html).toMatch(/\bbg-info-soft\b/);
    expect(html).toMatch(/\btext-info-foreground\b/);
  });
});
