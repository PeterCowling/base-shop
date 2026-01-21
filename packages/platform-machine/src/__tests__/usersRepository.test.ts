import { jest } from '@jest/globals';

import { prisma } from '@acme/platform-core/db';
import { readShop } from '@acme/platform-core/repositories/shops.server';
import { setStripeSubscriptionId } from '@acme/platform-core/repositories/users.server';

jest.mock('@acme/platform-core/repositories/shops.server', () => ({
  readShop: jest.fn(),
}));

jest.mock('@acme/platform-core/db', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

const readShopMock = readShop as jest.Mock;
const updateMock = prisma.user.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('setStripeSubscriptionId', () => {
  it('skips database update when subscriptions disabled', async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: false });

    await setStripeSubscriptionId('u1', 'sub', 'shop1');

    expect(readShopMock).toHaveBeenCalledWith('shop1');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('updates stripeSubscriptionId when subscriptions enabled', async () => {
    readShopMock.mockResolvedValue({ subscriptionsEnabled: true });

    await setStripeSubscriptionId('u1', 'sub', 'shop1');

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { stripeSubscriptionId: 'sub' },
    });
  });
});

