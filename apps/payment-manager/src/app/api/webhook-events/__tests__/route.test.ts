/**
 * TC-08: Webhook events list API tests
 */

import { GET } from "../route";

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));
jest.mock("../../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));
jest.mock("../../../../lib/auth/session", () => ({
  hasPmSession: jest.fn(),
}));

const { prisma } = require("@acme/platform-core/db"); // jest hoisting pattern
const { hasPmSession } = require("../../../../lib/auth/session") as { hasPmSession: jest.Mock }; // jest hoisting pattern

const prismaAny = prisma as any; // PM-0004 Prisma client type varies

const NOW = new Date("2026-03-13T12:00:00.000Z");
const OLDER = new Date("2026-03-13T11:00:00.000Z");

function makeEvent(overrides: Partial<{
  id: string; shop: string; type: string; status: string;
  lastError: string | null; createdAt: Date; updatedAt: Date;
}> = {}) {
  return {
    id: "evt_001",
    shop: "caryina",
    type: "checkout.session.completed",
    status: "processed",
    lastError: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeRequest(search = ""): Request {
  return new Request(`http://localhost/api/webhook-events${search}`);
}

beforeEach(() => {
  (hasPmSession as jest.Mock).mockResolvedValue(true);
  prismaAny.stripeWebhookEvent = {
    findMany: jest.fn().mockResolvedValue([]),
  };
});

describe("GET /api/webhook-events", () => {
  it("returns 401 when session is invalid", async () => {
    (hasPmSession as jest.Mock).mockResolvedValue(false);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("TC-08-01: filters by shop", async () => {
    const caryinaEvent = makeEvent({ shop: "caryina" });
    prismaAny.stripeWebhookEvent.findMany.mockResolvedValue([caryinaEvent]);

    const res = await GET(makeRequest("?shop=caryina"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].shop).toBe("caryina");

    const call = prismaAny.stripeWebhookEvent.findMany.mock.calls[0][0];
    expect(call.where).toMatchObject({ shop: "caryina" });
  });

  it("TC-08-02: filters by status=failed and returns lastError", async () => {
    const failedEvent = makeEvent({
      id: "evt_fail",
      status: "failed",
      lastError: "No such payment_intent: pi_xxx",
    });
    prismaAny.stripeWebhookEvent.findMany.mockResolvedValue([failedEvent]);

    const res = await GET(makeRequest("?status=failed"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].status).toBe("failed");
    expect(body.events[0].lastError).toBe("No such payment_intent: pi_xxx");

    const call = prismaAny.stripeWebhookEvent.findMany.mock.calls[0][0];
    expect(call.where).toMatchObject({ status: "failed" });
  });

  it("returns paginated results with nextCursor when > 50 events", async () => {
    const events = Array.from({ length: 51 }, (_, i) =>
      makeEvent({ id: `evt_${i.toString().padStart(3, "0")}`, updatedAt: new Date(NOW.getTime() - i * 1000) }),
    );
    prismaAny.stripeWebhookEvent.findMany.mockResolvedValue(events);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.events).toHaveLength(50);
    expect(body.nextCursor).not.toBeNull();
  });

  it("returns nextCursor=null when <= 50 events", async () => {
    const events = Array.from({ length: 3 }, (_, i) =>
      makeEvent({ id: `evt_${i}` }),
    );
    prismaAny.stripeWebhookEvent.findMany.mockResolvedValue(events);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.nextCursor).toBeNull();
  });

  it("TC-08-03 (typecheck): returns correctly shaped event objects", async () => {
    prismaAny.stripeWebhookEvent.findMany.mockResolvedValue([makeEvent()]);

    const res = await GET(makeRequest());
    const body = await res.json();
    const ev = body.events[0];

    expect(typeof ev.id).toBe("string");
    expect(typeof ev.shop).toBe("string");
    expect(typeof ev.type).toBe("string");
    expect(typeof ev.status).toBe("string");
    expect(typeof ev.createdAt).toBe("string");
    expect(typeof ev.updatedAt).toBe("string");
    // lastError may be null
    expect(ev.lastError === null || typeof ev.lastError === "string").toBe(true);
  });

  it("returns 500 on Prisma error", async () => {
    prismaAny.stripeWebhookEvent.findMany.mockRejectedValue(new Error("DB down"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
