// apps/cover-me-pretty/__tests__/cartApi.test.ts
// This suite verifies that the cover-me-pretty cart route delegates to the
// shared platform-core cartApi handlers, so behaviour is covered by the
// canonical tests in packages/platform-core.

import {
  DELETE as RouteDELETE,
  GET as RouteGET,
  PATCH as RoutePATCH,
  POST as RoutePOST,
  PUT as RoutePUT,
} from "../src/api/cart/route";
import {
  DELETE as CoreDELETE,
  GET as CoreGET,
  PATCH as CorePATCH,
  POST as CorePOST,
  PUT as CorePUT,
} from "@acme/platform-core/cartApi";

test("cover-me-pretty /api/cart re-exports shared cartApi handlers", () => {
  expect(RouteGET).toBe(CoreGET);
  expect(RoutePOST).toBe(CorePOST);
  expect(RoutePATCH).toBe(CorePATCH);
  expect(RouteDELETE).toBe(CoreDELETE);
  expect(RoutePUT).toBe(CorePUT);
});
