import { stripe } from "@acme/stripe";

jest.mock("../../src/analytics", () => ({ trackOrder: jest.fn() }));
jest.mock("../../src/subscriptionUsage", () => ({ incrementSubscriptionUsage: jest.fn() }));
jest.mock("../../src/db", () => ({
  prisma: {
    rentalOrder: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    shop: { findUnique: jest.fn() },
  },
}));
jest.mock("ulid", () => ({ ulid: jest.fn(() => "ulid") }));
jest.mock("@acme/date-utils", () => ({ nowIso: jest.fn(() => "now") }));
jest.mock("@acme/stripe", () => ({
  stripe: {
    refunds: { create: jest.fn() },
    checkout: { sessions: { retrieve: jest.fn() } },
  },
}));

export const { trackOrder } = jest.requireMock("../../src/analytics") as { trackOrder: jest.Mock };
export const { incrementSubscriptionUsage } = jest.requireMock("../../src/subscriptionUsage") as { incrementSubscriptionUsage: jest.Mock };
export const { prisma: prismaMock } = jest.requireMock("../../src/db") as {
  prisma: {
    rentalOrder: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
    };
    shop: { findUnique: jest.Mock };
  };
};
(prismaMock.rentalOrder as any).findUnique ||= jest.fn();
export const ulidMock = jest.requireMock("ulid").ulid as jest.Mock;
export const nowIsoMock = jest.requireMock("@acme/date-utils").nowIso as jest.Mock;
export const stripeRefund = stripe.refunds.create as jest.Mock;
export const stripeCheckoutRetrieve = stripe.checkout.sessions.retrieve as jest.Mock;
