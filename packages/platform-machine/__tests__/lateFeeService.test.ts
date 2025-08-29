// packages/platform-machine/__tests__/lateFeeService.test.ts
import type { RentalOrder } from "@acme/types";

describe("chargeLateFeesOnce", () => {
  const OLD_ENV = process.env;
  const OLD_NOW = Date.now;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
    } as NodeJS.ProcessEnv;
    Date.now = jest.fn(() => new Date("2024-01-10T00:00:00Z").getTime());
  });

  afterEach(() => {
    process.env = OLD_ENV;
    Date.now = OLD_NOW;
  });

  it("charges overdue orders and marks them", async () => {
    const stripeModule = await import("@acme/stripe");
    const stripeRetrieve = jest.fn().mockResolvedValue({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    const stripeCharge = jest.fn().mockResolvedValue({});
    stripeModule.stripe.checkout.sessions.retrieve = stripeRetrieve as any;
    stripeModule.stripe.paymentIntents.create = stripeCharge as any;

    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        returnDueDate: "2024-01-01",
      },
      {
        id: "2",
        sessionId: "sess2",
        shop: "test",
        returnDueDate: "2024-01-05",
        returnReceivedAt: "2024-01-06",
      },
      {
        id: "3",
        sessionId: "sess3",
        shop: "test",
        returnDueDate: "2024-01-09",
      },
      {
        id: "4",
        sessionId: "sess4",
        shop: "test",
        returnDueDate: "2024-01-01",
        lateFeeCharged: 25,
      },
    ];

    const readOrders = jest.fn().mockResolvedValue(orders);
    const markLateFeeCharged = jest.fn().mockResolvedValue(null);
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders,
      markLateFeeCharged,
    }));

    const readFile = jest.fn().mockImplementation(async (path: string) => {
      if (path.endsWith("shop.json")) {
        return JSON.stringify({
          lateFeePolicy: { gracePeriodDays: 3, feeAmount: 25 },
        });
      }
      throw new Error("not found");
    });
    const readdir = jest.fn().mockResolvedValue(["test"]);
    // Mock filesystem helpers used by the service. The implementation
    // imports from "fs/promises" (without the "node:" prefix), so the
    // mock must match that specifier exactly.
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir,
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    await chargeLateFeesOnce();

    expect(stripeRetrieve).toHaveBeenCalledTimes(1);
    expect(stripeRetrieve).toHaveBeenCalledWith("sess1", {
      expand: ["payment_intent", "customer"],
    });

    expect(stripeCharge).toHaveBeenCalledTimes(1);
    expect(stripeCharge).toHaveBeenCalledWith({
      amount: 25 * 100,
      currency: "usd",
      customer: "cus_1",
      payment_method: "pm_1",
      off_session: true,
      confirm: true,
    });

    expect(markLateFeeCharged).toHaveBeenCalledTimes(1);
    expect(markLateFeeCharged).toHaveBeenCalledWith("test", "sess1", 25);
  });

  it("does not charge orders within the grace period", async () => {
    const stripeModule = await import("@acme/stripe");
    const stripeRetrieve = jest.fn().mockResolvedValue({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    const stripeCharge = jest.fn().mockResolvedValue({});
    stripeModule.stripe.checkout.sessions.retrieve = stripeRetrieve as any;
    stripeModule.stripe.paymentIntents.create = stripeCharge as any;

    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        returnDueDate: "2024-01-07",
      },
    ];

    const readOrders = jest.fn().mockResolvedValue(orders);
    const markLateFeeCharged = jest.fn().mockResolvedValue(null);
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders,
      markLateFeeCharged,
    }));

    const readFile = jest.fn().mockImplementation(async (path: string) => {
      if (path.endsWith("shop.json")) {
        return JSON.stringify({
          lateFeePolicy: { gracePeriodDays: 3, feeAmount: 25 },
        });
      }
      throw new Error("not found");
    });
    const readdir = jest.fn().mockResolvedValue(["test"]);
    // Ensure the second test also mocks the correct module specifier.
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir,
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    await chargeLateFeesOnce();

    expect(stripeRetrieve).not.toHaveBeenCalled();
    expect(stripeCharge).not.toHaveBeenCalled();
    expect(markLateFeeCharged).not.toHaveBeenCalled();
  });
});

describe("resolveConfig", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("uses file defaults", async () => {
    const readFile = jest
      .fn()
      .mockResolvedValue(
        JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 5 } }),
      );
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data");

    expect(readFile).toHaveBeenCalledWith("/data/shop/settings.json", "utf8");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("overrides with environment variables", async () => {
    process.env.LATE_FEE_ENABLED_SHOP = "false";
    const readFile = jest
      .fn()
      .mockResolvedValue(
        JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 1 } }),
      );
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: { LATE_FEE_INTERVAL_MS: 120000 },
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data");

    expect(cfg).toEqual({ enabled: false, intervalMinutes: 2 });

    delete process.env.LATE_FEE_ENABLED_SHOP;
  });

  it("applies passed overrides", async () => {
    const readFile = jest.fn().mockResolvedValue("{}");
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data", {
      enabled: true,
      intervalMinutes: 2,
    });

    expect(cfg).toEqual({ enabled: true, intervalMinutes: 2 });
  });
});

describe("startLateFeeService", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
    }));
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error: jest.fn(), info: jest.fn() },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("skips disabled shops and schedules timers", async () => {
    const readdir = jest.fn().mockResolvedValue(["a", "b"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("a/settings.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeeService: { enabled: false } }),
        );
      if (path.endsWith("b/settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          }),
        );
      if (path.endsWith("b/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } }),
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile,
    }));

    const mod = await import("../src/lateFeeService");

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 111 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    const paths = readFile.mock.calls.map((c) => c[0]);
    expect(paths).toContain("/data/a/settings.json");
    expect(paths).not.toContain("/data/a/shop.json");
    expect(paths.filter((p) => p.includes("b/shop.json")).length).toBeGreaterThan(0);
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("auto-start", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NODE_ENV: "production" } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("logs errors when service fails to start", async () => {
    const err = new Error("boom");
    const readdir = jest.fn().mockRejectedValue(err);
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile: jest.fn(),
    }));
    const error = jest.fn();
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
    }));

    await import("../src/lateFeeService");
    await new Promise((r) => setTimeout(r, 0));

    expect(error).toHaveBeenCalledWith("failed to start late fee service", { err });
  });
});
