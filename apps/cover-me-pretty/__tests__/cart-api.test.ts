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
  DELETE as RouteDELETE,
  GET as RouteGET,
  PATCH as RoutePATCH,
  POST as RoutePOST,
} from "../src/api/cart/route";

test("App Router /api/cart re-exports the app cart handlers", () => {
  expect(AppGET).toBe(RouteGET);
  expect(AppPOST).toBe(RoutePOST);
  expect(AppPATCH).toBe(RoutePATCH);
  expect(AppDELETE).toBe(RouteDELETE);
});
