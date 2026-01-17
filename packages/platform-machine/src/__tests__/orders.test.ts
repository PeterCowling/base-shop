/** @jest-environment node */

import {
  listOrders,
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
  setReturnTracking,
  setReturnStatus,
  getOrdersForCustomer,
} from '@acme/platform-core/orders';

jest.mock('@acme/date-utils', () => ({ nowIso: jest.fn(() => '2025-01-02T03:04:05Z') }));
jest.mock('ulid', () => ({ ulid: jest.fn(() => 'id123') }));

jest.mock('@acme/platform-core/db', () => {
  const rentalOrders: any[] = [];
  return {
    prisma: {
      rentalOrder: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => {
          rentalOrders.push({ ...data });
          return data;
        }),
        update: jest.fn(),
      },
      shop: { findUnique: jest.fn() },
    },
    rentalOrders,
  };
});

jest.mock('@acme/platform-core/analytics', () => ({ trackOrder: jest.fn() }));
jest.mock('@acme/platform-core/subscriptionUsage', () => ({ incrementSubscriptionUsage: jest.fn() }));

const timestamp = '2025-01-02T03:04:05Z';

const { prisma, rentalOrders } = jest.requireMock('@acme/platform-core/db') as {
  prisma: {
    rentalOrder: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    shop: { findUnique: jest.Mock };
  };
  rentalOrders: any[];
};
const { trackOrder } = jest.requireMock('@acme/platform-core/analytics') as {
  trackOrder: jest.Mock;
};
const { incrementSubscriptionUsage } = jest.requireMock('@acme/platform-core/subscriptionUsage') as {
  incrementSubscriptionUsage: jest.Mock;
};

describe('orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rentalOrders.length = 0;
  });

  describe('listOrders', () => {
    it('normalizes null values', async () => {
      prisma.rentalOrder.findMany.mockResolvedValueOnce([
        { id: '1', returnedAt: null },
      ]);
      const orders = await listOrders('shop1');
      expect(orders).toEqual([{ id: '1', returnedAt: undefined }]);
    });
  });

	  describe('addOrder', () => {
	    it('creates minimal order', async () => {
	      const order = await addOrder({ shop: 'shop1', sessionId: 'sess1', deposit: 10 });
	      expect(order).toEqual({
	        id: 'id123',
	        sessionId: 'sess1',
        shop: 'shop1',
        deposit: 10,
        startedAt: timestamp,
      });
      expect(trackOrder).toHaveBeenCalledWith('shop1', 'id123', 10);
      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
    });

	    it('creates order with all fields and increments usage when enabled', async () => {
	      prisma.shop.findUnique.mockResolvedValueOnce({ data: { subscriptionsEnabled: true } });
	      const order = await addOrder({
	        shop: 'shop1',
	        sessionId: 'sess1',
	        deposit: 10,
	        expectedReturnDate: '2025-01-03',
	        returnDueDate: '2025-01-04',
	        customerId: 'cust1',
	        riskLevel: 'high',
	        riskScore: 42,
	        flaggedForReview: true,
	      });
	      expect(order).toEqual({
	        id: 'id123',
	        sessionId: 'sess1',
        shop: 'shop1',
        deposit: 10,
        startedAt: timestamp,
        expectedReturnDate: '2025-01-03',
        returnDueDate: '2025-01-04',
        customerId: 'cust1',
        riskLevel: 'high',
        riskScore: 42,
        flaggedForReview: true,
      });
      expect(incrementSubscriptionUsage).toHaveBeenCalledWith('shop1', 'cust1', '2025-01');
    });

	    it('skips subscription usage when disabled', async () => {
	      prisma.shop.findUnique.mockResolvedValueOnce({ data: { subscriptionsEnabled: false } });
	      await addOrder({ shop: 'shop1', sessionId: 'sess1', deposit: 10, customerId: 'cust1' });
	      expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
	    });
	  });

  describe('markReturned', () => {
    it('returns updated order', async () => {
      prisma.rentalOrder.update.mockResolvedValueOnce({
        id: '1',
        shop: 's',
        sessionId: 'sess',
        returnedAt: timestamp,
        damageFee: 2,
      });
      const order = await markReturned('s', 'sess', 2);
      expect(order).toEqual({
        id: '1',
        shop: 's',
        sessionId: 'sess',
        returnedAt: timestamp,
        damageFee: 2,
      });
    });

    it('returns null on error', async () => {
      prisma.rentalOrder.update.mockImplementationOnce(() => {
        throw new Error('fail');
      });
      await expect(markReturned('s', 'sess')).resolves.toBeNull();
    });
  });

  describe('markRefunded', () => {
    it('returns updated order', async () => {
      prisma.rentalOrder.update.mockResolvedValueOnce({
        id: '1',
        refundedAt: timestamp,
        riskLevel: 'low',
      });
      const order = await markRefunded('s', 'sess', 'low', 1, true);
      expect(order).toEqual({
        id: '1',
        refundedAt: timestamp,
        riskLevel: 'low',
      });
    });

    it('returns null on error', async () => {
      prisma.rentalOrder.update.mockRejectedValueOnce(new Error('fail'));
      const result = await markRefunded('s', 'sess');
      expect(result).toBeNull();
    });
  });

  describe('updateRisk', () => {
    it('returns updated order', async () => {
      prisma.rentalOrder.update.mockResolvedValueOnce({
        id: '1',
        riskLevel: 'medium',
        riskScore: 7,
        flaggedForReview: true,
      });
      const order = await updateRisk('s', 'sess', 'medium', 7, true);
      expect(order).toEqual({
        id: '1',
        riskLevel: 'medium',
        riskScore: 7,
        flaggedForReview: true,
      });
    });

    it('returns null on error', async () => {
      prisma.rentalOrder.update.mockRejectedValueOnce(new Error('fail'));
      const result = await updateRisk('s', 'sess');
      expect(result).toBeNull();
    });
  });

  describe('setReturnTracking', () => {
    it('returns updated order', async () => {
      prisma.rentalOrder.update.mockResolvedValueOnce({
        id: '1',
        trackingNumber: 'TN',
        labelUrl: 'http://label',
      });
      const order = await setReturnTracking('s', 'sess', 'TN', 'http://label');
      expect(order).toEqual({
        id: '1',
        trackingNumber: 'TN',
        labelUrl: 'http://label',
      });
    });

    it('returns null on error', async () => {
      prisma.rentalOrder.update.mockRejectedValueOnce(new Error('fail'));
      await expect(
        setReturnTracking('s', 'sess', 'TN', 'url')
      ).resolves.toBeNull();
    });
  });

  describe('setReturnStatus', () => {
    it('returns updated order', async () => {
      prisma.rentalOrder.update.mockResolvedValueOnce({
        id: '1',
        returnStatus: 'received',
      });
      const order = await setReturnStatus('s', 'TN', 'received');
      expect(order).toEqual({ id: '1', returnStatus: 'received' });
    });

    it('returns null on error', async () => {
      prisma.rentalOrder.update.mockRejectedValueOnce(new Error('fail'));
      const result = await setReturnStatus('s', 'TN', 'received');
      expect(result).toBeNull();
    });
  });

  describe('getOrdersForCustomer', () => {
    it('normalizes results', async () => {
      prisma.rentalOrder.findMany.mockResolvedValueOnce([
        { id: '1', trackingNumber: null },
      ]);
      const orders = await getOrdersForCustomer('s', 'cust');
      expect(orders).toEqual([{ id: '1', trackingNumber: undefined }]);
    });
  });
});
