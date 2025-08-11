jest.mock('node:fs/promises', () => ({
  readdir: jest.fn(),
}));

let readdirMock = require('node:fs/promises').readdir as jest.Mock;

const retrieveMock = jest.fn();
const refundMock = jest.fn();

jest.mock('@acme/stripe', () => ({
  stripe: {
    checkout: { sessions: { retrieve: retrieveMock } },
    refunds: { create: refundMock },
  },
}));

const readOrdersMock = jest.fn();
const markRefundedMock = jest.fn();

jest.mock('@platform-core/repositories/rentalOrders.server', () => ({
  readOrders: (...args: any[]) => readOrdersMock(...args),
  markRefunded: (...args: any[]) => markRefundedMock(...args),
}));

describe('scripts/release-deposits', () => {
  beforeEach(() => {
    jest.resetModules();
    readdirMock = require('node:fs/promises').readdir as jest.Mock;
    readdirMock.mockReset();
    retrieveMock.mockReset();
    refundMock.mockReset();
    readOrdersMock.mockReset();
    markRefundedMock.mockReset();
    process.env.STRIPE_SECRET_KEY = 'sk';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk';
    process.exit = jest.fn() as any;
  });

  it('refunds returned deposits', async () => {
    readdirMock.mockResolvedValue(['shop1']);
    readOrdersMock.mockResolvedValue([
      { deposit: 10, sessionId: 'sess1', returnedAt: 'now', refundedAt: undefined },
    ]);
    retrieveMock.mockResolvedValue({ payment_intent: 'pi_1' });
    refundMock.mockResolvedValue({});

    await import('../../scripts/release-deposits');
    await new Promise(process.nextTick);

    expect(retrieveMock).toHaveBeenCalledWith('sess1', { expand: ['payment_intent'] });
    expect(refundMock).toHaveBeenCalledWith({ payment_intent: 'pi_1', amount: 1000 });
    expect(markRefundedMock).toHaveBeenCalledWith('shop1', 'sess1');
  });
});