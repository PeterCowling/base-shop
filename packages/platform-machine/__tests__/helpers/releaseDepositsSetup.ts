process.env.STRIPE_SECRET_KEY = "sk";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
process.env.CART_COOKIE_SECRET = "secret";

const ORIGINAL_ENV = { ...process.env };

export const readdir = jest.fn();
export const readFile = jest.fn();
jest.mock("node:fs/promises", () => ({
  __esModule: true,
  readdir,
  readFile,
}));

export const retrieve = jest.fn();
export const createRefund = jest.fn();
jest.mock(
  "@acme/stripe",
  () => ({
    __esModule: true,
    stripe: {
      checkout: { sessions: { retrieve } },
      refunds: { create: createRefund },
    },
  }),
  { virtual: true },
);

export const readOrders = jest.fn();
export const markRefunded = jest.fn();
jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({
  __esModule: true,
  readOrders,
  markRefunded,
}));

export function resetReleaseDepositsEnv(): void {
  jest.clearAllMocks();
  readFile.mockResolvedValue("{}");
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
}

export function restoreOriginalEnv(): void {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
}
