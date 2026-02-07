import { jest } from "@jest/globals";

type StripeMock = {
  checkout: { sessions: { retrieve: jest.Mock } };
  refunds?: { create: jest.Mock };
  paymentIntents?: { create: jest.Mock };
};

export function mockStripe(overrides: Partial<StripeMock> = {}) {
  const stripe: StripeMock = {
    checkout: { sessions: { retrieve: jest.fn() } },
    refunds: { create: jest.fn() },
    paymentIntents: { create: jest.fn() },
    ...overrides,
  } as any;
  jest.doMock(
    "@acme/stripe",
    () => ({ __esModule: true, stripe }),
    { virtual: true },
  );
  return stripe;
}

type RentalRepoMock = {
  addOrder: jest.Mock;
  markReturned: jest.Mock;
  markRefunded: jest.Mock;
};

export function mockRentalRepo(overrides: Partial<RentalRepoMock> = {}) {
  const repo: RentalRepoMock = {
    addOrder: jest.fn(),
    markReturned: jest.fn(),
    markRefunded: jest.fn(),
    ...overrides,
  };
  jest.doMock(
    "@acme/platform-core/repositories/rentalOrders.server",
    () => ({ __esModule: true, ...repo }),
  );
  return repo;
}
