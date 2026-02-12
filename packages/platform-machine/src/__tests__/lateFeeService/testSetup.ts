import { coreEnv } from "@acme/config/env/core";
import {
  markLateFeeCharged,
  readOrders,
} from "@acme/platform-core/repositories/rentalOrders.server";
import { logger } from "@acme/platform-core/utils";
import { stripe } from "@acme/stripe";

// Mock fs/promises with actual mock functions
const readdirMock = jest.fn();
const readFileMock = jest.fn();

jest.mock("fs/promises", () => ({
  readFile: readFileMock,
  readdir: readdirMock,
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    paymentIntents: { create: jest.fn() },
  },
}));

jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({
  readOrders: jest.fn(),
  markLateFeeCharged: jest.fn(),
}));

jest.mock("@acme/platform-core/utils", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {},
}));

export { readdirMock, readFileMock };
export const stripeRetrieveMock = stripe.checkout.sessions
  .retrieve as unknown as jest.Mock;
export const stripeChargeMock = stripe.paymentIntents.create as unknown as jest.Mock;
export const readOrdersMock = readOrders as jest.Mock;
export const markLateFeeChargedMock = markLateFeeCharged as jest.Mock;
export const loggerInfoMock = logger.info as jest.Mock;
export const loggerErrorMock = logger.error as jest.Mock;
export { coreEnv };

export const NOW = new Date("2024-01-10T00:00:00Z").getTime();
