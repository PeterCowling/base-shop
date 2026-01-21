/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  getCustomerSession,
  hasPermission,
  listSessions,
  revokeSession as authRevokeSession,
} from "@acme/auth";

import { revoke } from "../src/actions/revokeSession";

jest.mock("@acme/auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  listSessions: jest.fn(),
  hasPermission: jest.fn(),
  revokeSession: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const session = { role: "admin", customerId: "cust" };
const headers = { "Content-Type": "application/json" };
const originalFetch = global.fetch;

describe("revoke session action", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (hasPermission as jest.Mock).mockReturnValue(true);
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "s1" }]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends request and resolves on success", async () => {
    const fetchMock = jest
      .fn<Promise<Response>, [RequestInfo, RequestInit?]>()
      .mockResolvedValue({ ok: true } as Response);
    global.fetch = fetchMock as typeof fetch;
    (authRevokeSession as jest.Mock).mockImplementation((id: string) =>
      fetch(`/api/sessions/${id}`, { method: "DELETE", headers })
    );

    const result = await revoke("s1");

    expect(fetchMock).toHaveBeenCalledWith("/api/sessions/s1", {
      method: "DELETE",
      headers,
    });
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/account/sessions");
  });

  it("propagates API errors", async () => {
    const fetchMock = jest
      .fn<Promise<Response>, [RequestInfo, RequestInit?]>()
      .mockResolvedValue({ ok: false } as Response);
    global.fetch = fetchMock as typeof fetch;
    (authRevokeSession as jest.Mock).mockImplementation((id: string) =>
      fetch(`/api/sessions/${id}`, { method: "DELETE", headers }).then((r) => {
        if (!r.ok) throw new Error("bad");
      })
    );

    const result = await revoke("s1");

    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("handles network failures gracefully", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network"));
    global.fetch = fetchMock as any;
    (authRevokeSession as jest.Mock).mockImplementation((id: string) =>
      fetch(`/api/sessions/${id}`, { method: "DELETE", headers })
    );

    const result = await revoke("s1");

    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("fails when no customer session is available", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);

    const result = await revoke("s1");

    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(listSessions).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("fails when user lacks permission", async () => {
    (hasPermission as jest.Mock).mockReturnValue(false);

    const result = await revoke("s1");

    expect(result).toEqual({ success: false, error: "account.sessions.errors.revokeFailed" });
    expect(listSessions).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns an error if the session does not belong to the user", async () => {
    (listSessions as jest.Mock).mockResolvedValue([{ sessionId: "s2" }]);

    const result = await revoke("s1");

    expect(result).toEqual({ success: false, error: "account.sessions.errors.notOwned" });
    expect(authRevokeSession).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
