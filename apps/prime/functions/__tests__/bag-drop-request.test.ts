/**
 * @jest-environment node
 */

import { onRequestPost } from "../api/bag-drop-request";
import { FirebaseRest } from "../lib/firebase-rest";
import { createMockEnv, createMockKv, createPagesContext } from "./helpers";

describe("/api/bag-drop-request", () => {
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

  it("TC-01: checked-out guest can submit bag-drop request", async () => {
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
          checkOutDate: "2000-01-01",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      if (path === "bagStorage/occ_1234567890123") {
        return null;
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/bag-drop-request",
        method: "POST",
        body: {
          token: "token-1",
          pickupWindow: "16:00-18:00",
          note: "Will collect before dinner.",
        },
        env,
      }),
    );

    const payload = await response.json() as { success: boolean; requestId: string };
    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.requestId).toContain("bag_drop_");
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it("TC-02: checked-in guest gets eligibility guidance and no mutation", async () => {
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
          checkOutDate: "2099-02-10",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/bag-drop-request",
        method: "POST",
        body: {
          token: "token-1",
          pickupWindow: "16:00-18:00",
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("TC-03: duplicate active request returns idempotent response", async () => {
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
          checkOutDate: "2000-01-01",
          firstName: "Jane",
          lastName: "Doe",
        };
      }
      if (path === "bagStorage/occ_1234567890123") {
        return {
          optedIn: true,
          requestStatus: "pending",
          requestId: "bag_drop_existing",
        };
      }
      return null;
    });

    const response = await onRequestPost(
      createPagesContext({
        url: "https://prime.example.com/api/bag-drop-request",
        method: "POST",
        body: {
          token: "token-1",
          pickupWindow: "16:00-18:00",
        },
      }),
    );

    const payload = await response.json() as { deduplicated: boolean; requestId: string };
    expect(response.status).toBe(200);
    expect(payload.deduplicated).toBe(true);
    expect(payload.requestId).toBe("bag_drop_existing");
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
