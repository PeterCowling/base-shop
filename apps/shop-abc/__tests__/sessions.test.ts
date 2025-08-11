// apps/shop-abc/__tests__/sessions.test.ts
import {
  createCustomerSession,
  listSessions,
  revokeSession,
} from "../../../packages/auth/src/session";

const jar = new Map<string, string>();

jest.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) =>
      jar.has(name) ? { value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
  headers: () => new Headers({ "user-agent": "jest" }),
}));

describe("session listing and revocation", () => {
  beforeEach(() => {
    jar.clear();
    process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";
  });

  it("lists and revokes sessions", async () => {
    await createCustomerSession({ customerId: "cust", role: "customer" as any });
    let sessions = await listSessions("cust");
    expect(sessions).toHaveLength(1);
    await revokeSession(sessions[0].sessionId);
    sessions = await listSessions("cust");
    expect(sessions).toHaveLength(0);
  });

  it("handles missing sessions gracefully", async () => {
    let sessions = await listSessions("none");
    expect(sessions).toHaveLength(0);
    await expect(revokeSession("nosuch")).resolves.toBeUndefined();
  });
});
