// apps/cover-me-pretty/__tests__/cart-api.test.ts
// Ensure the App Router variant of /api/cart also delegates directly to the
// shared platform-core cartApi handlers.

import {
  DELETE as AppDELETE,
  GET as AppGET,
  PATCH as AppPATCH,
  POST as AppPOST,
} from "../src/app/api/cart/route";
import {
  DELETE as CoreDELETE,
  GET as CoreGET,
  PATCH as CorePATCH,
  POST as CorePOST,
} from "@acme/platform-core/cartApi";

test("App Router /api/cart re-exports shared cartApi handlers", () => {
  expect(AppGET).toBe(CoreGET);
  expect(AppPOST).toBe(CorePOST);
  expect(AppPATCH).toBe(CorePATCH);
  expect(AppDELETE).toBe(CoreDELETE);
});
