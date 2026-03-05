/**
 * @jest-environment node
 */

import { onRequestPost } from "../api/extension-request";
import { FirebaseRest } from "../lib/firebase-rest";

import { createMockEnv, createMockKv, createPagesContext } from "./helpers";

describe("/api/extension-request", () => {
  const getSpy = jest.spyOn(FirebaseRest.prototype, "get");
  const updateSpy = jest.spyOn(FirebaseRest.prototype, "update");

  beforeEach(() => {
    jest.clearAllMocks();
    updateSpy.mockResolvedValue(undefined);
  });

  afterAll(() => {
    getSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("TC-01: valid request writes one Prime request record and one outbound draft", async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "bookings/BOOK123/occ_1234567890123") {
        return {
          checkOutDate: "2026-02-12",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-14",
          note: "Need two extra nights.",
        },
        env,
      }),
    );

    const payload = await response.json() as { success: boolean; requestId: string; deliveryMode: string };
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.requestId).toBe("extension_book123_occ_1234567890123_20260214");
    expect(payload.deliveryMode).toBe("outbox");

    // Prime request + outbound draft written atomically
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(
      "/",
      expect.objectContaining({
        "outboundDrafts/extension_book123_occ_1234567890123_20260214": expect.objectContaining({
          to: "hostelbrikette@gmail.com",
          subject: "[Prime] Extension request BOOK123",
          category: "extension-ops",
          guestName: "Jane Doe",
          bookingCode: "BOOK123",
          eventId: "extension_book123_occ_1234567890123_20260214",
          status: "pending",
          createdAt: expect.any(String),
        }),
        "primeRequests/byId/extension_book123_occ_1234567890123_20260214": expect.objectContaining({
          requestId: "extension_book123_occ_1234567890123_20260214",
          type: "extension",
          status: "pending",
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
        }),
      }),
    );
  });

  it("TC-01b: deterministic requestId stays stable across repeated valid submissions", async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "bookings/BOOK123/occ_1234567890123") {
        return {
          checkOutDate: "2026-02-12",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      return null;
    });

    const firstResponse = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-14",
        },
        env,
      }),
    );
    const secondResponse = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-14",
        },
        env,
      }),
    );

    const firstPayload = await firstResponse.json() as { requestId: string };
    const secondPayload = await secondResponse.json() as { requestId: string };
    expect(firstPayload.requestId).toBe("extension_book123_occ_1234567890123_20260214");
    expect(secondPayload.requestId).toBe("extension_book123_occ_1234567890123_20260214");
  });

  it("TC-01c: deterministic requestId changes when requested date changes", async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "bookings/BOOK123/occ_1234567890123") {
        return {
          checkOutDate: "2026-02-12",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-15",
        },
        env,
      }),
    );

    const payload = await response.json() as { requestId: string };
    expect(payload.requestId).toBe("extension_book123_occ_1234567890123_20260215");
  });

  it("TC-01d: outbound draft payload is included in same update call", async () => {
    const kv = createMockKv();
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      if (path === "bookings/BOOK123/occ_1234567890123") {
        return {
          checkOutDate: "2026-02-12",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      return null;
    });

    await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-14",
        },
        env,
      }),
    );

    const updatePayload = updateSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(updatePayload["outboundDrafts/extension_book123_occ_1234567890123_20260214"]).toEqual(
      expect.objectContaining({
        to: "hostelbrikette@gmail.com",
        subject: "[Prime] Extension request BOOK123",
        category: "extension-ops",
        guestName: "Jane Doe",
        bookingCode: "BOOK123",
        eventId: "extension_book123_occ_1234567890123_20260214",
        status: "pending",
        createdAt: expect.any(String),
      }),
    );
  });

  it("TC-02: invalid request date returns 400 with actionable error", async () => {
    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "14/02/2026",
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("TC-03: rate limit threshold returns 429 and does not dispatch", async () => {
    const kv = createMockKv({
      "extension-rate:occ_1234567890123": "3",
    });
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-14",
        },
        env,
      }),
    );

    expect(response.status).toBe(429);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("TC-04: duplicate same-session submission returns deterministic dedupe response", async () => {
    const kv = createMockKv({
      "extension-dedupe:occ_1234567890123:2026-02-14": "extension_abc",
    });
    const env = createMockEnv({ RATE_LIMIT: kv });

    getSpy.mockImplementation(async (path: string) => {
      if (path === "guestSessionsByToken/token-1") {
        return {
          bookingId: "BOOK123",
          guestUuid: "occ_1234567890123",
          createdAt: "2026-02-01T00:00:00.000Z",
          expiresAt: "2099-02-01T00:00:00.000Z",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/extension-request",
        method: "POST",
        body: {
          token: "token-1",
          requestedCheckOutDate: "2026-02-14",
        },
        env,
      }),
    );

    const payload = await response.json() as { deduplicated: boolean; requestId: string };
    expect(response.status).toBe(200);
    expect(payload.deduplicated).toBe(true);
    expect(payload.requestId).toBe("extension_abc");
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
