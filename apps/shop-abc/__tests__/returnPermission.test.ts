// apps/shop-abc/__tests__/returnPermission.test.ts
import type { NextRequest } from "next/server";

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("/api/return permission", () => {
  test("denies access without manage_orders permission", async () => {
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
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@shared-utils", () => ({
      __esModule: true,
      parseJsonBody: jest.fn().mockResolvedValue({ success: true, data: { sessionId: "sess", damageFee: 0 } }),
    }));
    jest.doMock("@auth", () => ({
      __esModule: true,
      requirePermission: jest.fn().mockRejectedValue(new Error("nope")),
    }));
    const { POST } = await import("../src/app/api/return/route");
    const res = await POST({} as NextRequest);
    expect(res.status).toBe(403);
  });

  test("allows access with manage_orders permission", async () => {
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
                metadata: { depositTotal: "50" },
                payment_intent: { id: "pi_1" },
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
      markReturned: jest.fn().mockResolvedValue({ deposit: 50 }),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@shared-utils", () => ({
      __esModule: true,
      parseJsonBody: jest
        .fn()
        .mockResolvedValue({ success: true, data: { sessionId: "sess", damageFee: 20 } }),
    }));
    const { POST } = await import("../src/app/api/return/route");
    const res = await POST({} as any);
    expect(res.status).toBe(200);
  });
});

