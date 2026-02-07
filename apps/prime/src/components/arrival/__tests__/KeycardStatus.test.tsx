import { render, screen } from '@testing-library/react';
import KeycardStatus from '../KeycardStatus';
import type { GuestKeycardStatus } from '../../../lib/preArrival/keycardStatus';

function renderWithStatus(status: GuestKeycardStatus) {
  render(<KeycardStatus status={status} />);
}

describe('KeycardStatus', () => {
  it('TC-01: keycard status issued shows issued badge', () => {
    renderWithStatus({
      state: 'issued',
      hasLostCardNotice: false,
      latestTransactionType: 'loan',
      latestTransactionAt: '2026-02-07T09:00:00.000Z',
    });

    expect(screen.getByText('Keycard issued')).toBeDefined();
  });

  it('TC-02: missing status shows pending issue guidance', () => {
    renderWithStatus({
      state: 'pending-issue',
      hasLostCardNotice: false,
      latestTransactionType: null,
      latestTransactionAt: null,
    });

    expect(screen.getByText('Keycard will be issued at check-in')).toBeDefined();
  });

  it('TC-03: lost card state renders support instructions', () => {
    renderWithStatus({
      state: 'lost',
      hasLostCardNotice: true,
      latestTransactionType: 'no_card',
      latestTransactionAt: '2026-02-07T11:00:00.000Z',
    });

    expect(screen.getByText('Keycard support needed')).toBeDefined();
    expect(
      screen.getByText('If your keycard is missing, go to reception immediately for deactivation and replacement.'),
    ).toBeDefined();
  });
});
