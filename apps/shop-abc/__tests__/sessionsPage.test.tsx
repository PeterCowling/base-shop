// apps/shop-abc/__tests__/sessionsPage.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  listSessions: jest.fn(),
  revokeSession: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import {
  getCustomerSession,
  listSessions,
  revokeSession,
} from "@auth";
import { revalidatePath } from "next/cache";
import SessionsPage, { revoke } from "@ui/src/components/account/Sessions";

describe("/account/sessions page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("shows message for unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const element = await SessionsPage({});
    expect(getCustomerSession).toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe(
      "Please log in to view your sessions.",
    );
  });

  it("lists sessions for authenticated users", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    const sessions = [
      { sessionId: "s1", userAgent: "ua1", createdAt: new Date() },
      { sessionId: "s2", userAgent: "ua2", createdAt: new Date() },
    ];
    (listSessions as jest.Mock).mockResolvedValue(sessions);
    const element = await SessionsPage({});
    const list = element.props.children[1];
    expect(list.type).toBe("ul");
    expect(list.props.children).toHaveLength(2);
  });
});

describe("revoke session", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("revokes and revalidates on success", async () => {
    await revoke("s1");
    expect(revokeSession).toHaveBeenCalledWith("s1");
    expect(revalidatePath).toHaveBeenCalledWith("/account/sessions");
  });

  it("propagates errors on failure", async () => {
    (revokeSession as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(revoke("s2")).rejects.toThrow("boom");
  });
});
