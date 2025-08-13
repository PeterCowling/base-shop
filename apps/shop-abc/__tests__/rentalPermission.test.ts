// apps/shop-abc/__tests__/rentalPermission.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    refunds: { create: jest.fn() },
  },
}));

jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  addOrder: jest.fn(),
  markReturned: jest.fn(),
}));

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));

jest.mock("@shared-utils", () => ({ parseJsonBody: jest.fn() }));

import { POST, PATCH } from "../src/app/api/rental/route";
import { requirePermission } from "@auth";
import { stripe } from "@acme/stripe";
import { addOrder, markReturned } from "@platform-core/repositories/rentalOrders.server";
import { parseJsonBody } from "@shared-utils";

function createRequest(body: any, method: string): Parameters<typeof POST>[0] {
  return new Request("http://localhost/api/rental", {
    method,
    body: JSON.stringify(body),
  }) as any;
}

afterEach(() => {
  jest.clearAllMocks();
});

test("POST denies access without manage_orders permission", async () => {
  (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
  const res = await POST({} as any);
  expect(res.status).toBe(403);
  expect(addOrder).not.toHaveBeenCalled();
});

test("POST allows access with manage_orders permission", async () => {
  (requirePermission as jest.Mock).mockResolvedValue({});
  (parseJsonBody as jest.Mock).mockResolvedValue({
    success: true,
    data: { sessionId: "s1" },
  });
  (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
    metadata: { depositTotal: "5", returnDate: "2025-01-01" },
  });
  const res = await POST(createRequest({ sessionId: "s1" }, "POST"));
  expect(res.status).toBe(200);
  expect(addOrder).toHaveBeenCalled();
});

test("PATCH denies access without manage_orders permission", async () => {
  (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
  const res = await PATCH({} as any);
  expect(res.status).toBe(403);
  expect(markReturned).not.toHaveBeenCalled();
});

test("PATCH allows access with manage_orders permission", async () => {
  (requirePermission as jest.Mock).mockResolvedValue({});
  (parseJsonBody as jest.Mock).mockResolvedValue({
    success: true,
    data: { sessionId: "s1" },
  });
  (markReturned as jest.Mock).mockResolvedValue({ deposit: 10 });
  (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
    payment_intent: { id: "pi_1" },
  });
  const res = await PATCH(createRequest({ sessionId: "s1" }, "PATCH"));
  expect(res.status).toBe(200);
  expect(markReturned).toHaveBeenCalled();
});

