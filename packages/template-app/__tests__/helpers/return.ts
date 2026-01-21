import { jest } from "@jest/globals";
import type Stripe from "stripe";

import type { RentalOrder } from "@acme/types";

type SessionSubset = Pick<Stripe.Checkout.Session, "metadata" | "payment_intent">;

interface MockOptions {
  session?: SessionSubset;
  shop?: { returnsEnabled?: boolean; coverageIncluded?: boolean };
}

export function setupReturnMocks(options: MockOptions = {}) {
  process.env.STRIPE_SECRET_KEY = "sk_test";
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";

  const ResponseWithJson = Response as unknown as typeof Response & {
    json?: (data: unknown, init?: ResponseInit) => Response;
  };
  if (typeof ResponseWithJson.json !== "function") {
    ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init);
  }

  const session: SessionSubset =
    options.session ?? ({
      metadata: { depositTotal: "50" },
      payment_intent: "pi_1",
    } as SessionSubset);

  const retrieve = jest
    .fn<Promise<SessionSubset>, []>()
    .mockResolvedValue(session);
  const refundCreate = jest.fn();
  const computeDamageFee = jest.fn();
  const markReturned = jest
    .fn<Promise<RentalOrder | null>, []>()
    .mockResolvedValue({} as RentalOrder);

  jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
    __esModule: true,
    readShop: jest
      .fn()
      .mockResolvedValue({
        returnsEnabled: true,
        coverageIncluded: true,
        ...(options.shop ?? {}),
      }),
  }));

  jest.doMock(
    "@acme/stripe",
    () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve } },
        refunds: { create: refundCreate },
      },
    }),
    { virtual: true }
  );

  jest.doMock("@acme/platform-core/repositories/rentalOrders.server", () => ({
    __esModule: true,
    markReturned,
    markRefunded: jest.fn(),
    addOrder: jest.fn(),
  }));

  jest.doMock("@acme/platform-core/pricing", () => ({ computeDamageFee }));

  return { retrieve, refundCreate, computeDamageFee, markReturned };
}

export type { SessionSubset };
