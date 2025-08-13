// apps/shop-abc/__tests__/rentalPermission.test.ts
import type { NextRequest } from "next/server";

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("/api/rental permission", () => {
  test("POST denies access without manage_orders permission", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: {
        json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
      },
    }));
    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve: jest.fn() } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned: jest.fn(),
    }));
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("nope")),
    }));
    const { POST } = await import("../src/app/api/rental/route");
    const res = await POST({} as NextRequest);
    expect(res.status).toBe(403);
  });

  test("POST allows access with manage_orders permission", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: {
        json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
      },
    }));
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockResolvedValue({}),
    }));
    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: {
            sessions: {
              retrieve: jest.fn().mockResolvedValue({
                metadata: { depositTotal: "50", returnDate: "2030-01-02" },
              }),
            },
          },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned: jest.fn(),
    }));
    jest.doMock("@shared-utils", () => ({
      __esModule: true,
      parseJsonBody: jest.fn().mockResolvedValue({ success: true, data: { sessionId: "sess" } }),
    }));
    const { POST } = await import("../src/app/api/rental/route");
    const res = await POST({} as any);
    expect(res.status).toBe(200);
  });

  test("PATCH denies access without manage_orders permission", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: {
        json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
      },
    }));
    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve: jest.fn() } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned: jest.fn(),
    }));
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("nope")),
    }));
    const { PATCH } = await import("../src/app/api/rental/route");
    const res = await PATCH({} as NextRequest);
    expect(res.status).toBe(403);
  });

  test("PATCH allows access with manage_orders permission", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: {
        json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
      },
    }));
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockResolvedValue({}),
    }));
    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve: jest.fn().mockResolvedValue({ payment_intent: { id: "pi_1" } }) } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned: jest.fn().mockResolvedValue({ deposit: 40 }),
    }));
    jest.doMock("@shared-utils", () => ({
      __esModule: true,
      parseJsonBody: jest
        .fn()
        .mockResolvedValue({ success: true, data: { sessionId: "sess", damageFee: 10 } }),
    }));
    const { PATCH } = await import("../src/app/api/rental/route");
    const res = await PATCH({} as any);
    expect(res.status).toBe(200);
  });
});

