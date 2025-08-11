// apps/shop-abc/__tests__/accountProfileHead.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("next/headers", () => ({
  __esModule: true,
  cookies: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import { cookies } from "next/headers";
import Head from "../src/app/account/profile/head";

it("renders csrf meta tag", async () => {
  (getCustomerSession as jest.Mock).mockResolvedValue({});
  (cookies as jest.Mock).mockResolvedValue({
    get: () => ({ value: "csrf123" }),
  });
  const element = await Head();
  expect(getCustomerSession).toHaveBeenCalled();
  expect(cookies).toHaveBeenCalled();
  expect(element.type).toBe("meta");
  expect(element.props).toMatchObject({ name: "csrf-token", content: "csrf123" });
});

