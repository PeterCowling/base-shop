import { deriveGuestKeycardStatus } from '../keycardStatus';

describe('deriveGuestKeycardStatus', () => {
  it('returns pending-issue when no loans exist', () => {
    expect(deriveGuestKeycardStatus(null)).toEqual({
      state: 'pending-issue',
      hasLostCardNotice: false,
      latestTransactionType: null,
      latestTransactionAt: null,
    });
  });

  it('returns issued when latest keycard transaction is a loan', () => {
    const status = deriveGuestKeycardStatus({
      txns: {
        a: {
          type: 'loan',
          item: 'Keycard',
          count: 1,
          deposit: 10,
          depositType: 'CASH',
          createdAt: '2026-02-07T10:00:00.000Z',
        },
      },
    });

    expect(status.state).toBe('issued');
    expect(status.latestTransactionType).toBe('loan');
  });

  it('returns lost when latest keycard transaction is no_card', () => {
    const status = deriveGuestKeycardStatus({
      txns: {
        loan: {
          type: 'loan',
          item: 'Keycard',
          count: 1,
          deposit: 10,
          depositType: 'CASH',
          createdAt: '2026-02-07T10:00:00.000Z',
        },
        lost: {
          type: 'no_card',
          item: 'Keycard',
          count: 1,
          deposit: 0,
          depositType: 'CASH',
          createdAt: '2026-02-07T12:00:00.000Z',
        },
      },
    });

    expect(status.state).toBe('lost');
    expect(status.hasLostCardNotice).toBe(true);
    expect(status.latestTransactionType).toBe('no_card');
  });
});
