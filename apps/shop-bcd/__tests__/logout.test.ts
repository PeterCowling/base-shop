// apps/shop-bcd/__tests__/logout.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  destroyCustomerSession: jest.fn(),
}));
jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { destroyCustomerSession } from "@auth";
import { cookies } from "next/headers";
import { GET } from "../src/app/logout/route";

afterEach(() => jest.clearAllMocks());

test("destroys session and redirects to home", async () => {
  const req = new Request("http://example.com/logout");
  const res = await GET(req);
  expect(destroyCustomerSession).toHaveBeenCalled();
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe("/");
});

test("propagates errors from session destroy", async () => {
  (destroyCustomerSession as jest.Mock).mockRejectedValueOnce(new Error("boom"));
  const req = new Request("http://example.com/logout");
  await expect(GET(req)).rejects.toThrow("boom");
});

test("removes session cookies", async () => {
  const data = new Map<
    string,
    { name: string; value: string }
  >([
    ["customer_session", { name: "customer_session", value: "a" }],
    ["csrf_token", { name: "csrf_token", value: "b" }],
  ]);
  const store = {
    get: jest.fn((name: string) => data.get(name)),
    set: jest.fn(),
    delete: jest.fn(({ name }: { name: string }) => {
      data.delete(name);
    }),
  };
  (cookies as unknown as jest.Mock).mockResolvedValue(store);
  (destroyCustomerSession as jest.Mock).mockImplementationOnce(async () => {
    const s = await cookies();
    s.delete({ name: "customer_session" });
    s.delete({ name: "csrf_token" });
  });
  const req = new Request("http://example.com/logout");
  await GET(req);
  expect(data.has("customer_session")).toBe(false);
  expect(data.has("csrf_token")).toBe(false);
});
