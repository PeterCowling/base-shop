// apps/shop-abc/__tests__/returnPermission.test.ts

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
  markReturned: jest.fn(),
  markRefunded: jest.fn(),
}));

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));

jest.mock("@shared-utils", () => ({ parseJsonBody: jest.fn() }));

import { POST } from "../src/app/api/return/route";
import { requirePermission } from "@auth";
import { stripe } from "@acme/stripe";
import { markReturned } from "@platform-core/repositories/rentalOrders.server";
import { parseJsonBody } from "@shared-utils";

function createRequest(body = { sessionId: "s1" }): Parameters<typeof POST>[0] {
  return new Request("http://localhost/api/return", {
    method: "POST",
    body: JSON.stringify(body),
  }) as any;
}

afterEach(() => {
  jest.clearAllMocks();
});

test("denies access without manage_orders permission", async () => {
  (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
  const res = await POST({} as any);
  expect(res.status).toBe(403);
  expect(markReturned).not.toHaveBeenCalled();
});

test("allows access with manage_orders permission", async () => {
  (requirePermission as jest.Mock).mockResolvedValue({});
  (parseJsonBody as jest.Mock).mockResolvedValue({
    success: true,
    data: { sessionId: "s1" },
  });
  (markReturned as jest.Mock).mockResolvedValue({ deposit: 10 });
  (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
    metadata: { depositTotal: "10" },
    payment_intent: { id: "pi_1" },
  });
  const res = await POST(createRequest());
  expect(res.status).toBe(200);
});

