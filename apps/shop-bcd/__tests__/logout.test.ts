// apps/shop-bcd/__tests__/logout.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  destroyCustomerSession: jest.fn(),
}));

import { destroyCustomerSession } from "@auth";
import { GET } from "../src/app/logout/route";

afterEach(() => jest.clearAllMocks());

test("destroys session and redirects to home", async () => {
  const req = new Request("http://example.com/logout");
  const res = await GET(req as any);
  expect(destroyCustomerSession).toHaveBeenCalled();
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe("/");
});

test("propagates errors from session destroy", async () => {
  (destroyCustomerSession as jest.Mock).mockRejectedValueOnce(new Error("boom"));
  const req = new Request("http://example.com/logout");
  await expect(GET(req as any)).rejects.toThrow("boom");
});
