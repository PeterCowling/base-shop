/**
 * @jest-environment node
 */

import { onRequestPost } from "../api/extension-request";
import { FirebaseRest } from "../lib/firebase-rest";

import { createMockEnv, createMockKv, createPagesContext } from "./helpers";

const dispatchPrimeEmailMock = jest.fn(async () => ({
  delivered: false,
  deliveryMode: "noop",
}));

jest.mock("../lib/email-dispatch", () => ({
  dispatchPrimeEmail: (...args: unknown[]) => dispatchPrimeEmailMock(...args),
}));

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

  it("TC-01: valid request writes one Prime request record and dispatches one email payload", async () => {
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

    const payload = await response.json() as { success: boolean; requestId: string };
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.requestId).toContain("extension_");
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(dispatchPrimeEmailMock).toHaveBeenCalledTimes(1);
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
    expect(dispatchPrimeEmailMock).not.toHaveBeenCalled();
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
    expect(dispatchPrimeEmailMock).not.toHaveBeenCalled();
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
    expect(dispatchPrimeEmailMock).not.toHaveBeenCalled();
  });
});
