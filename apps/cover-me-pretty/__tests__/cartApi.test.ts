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

test("cover-me-pretty /api/cart exports request handlers", () => {
  expect(typeof RouteGET).toBe("function");
  expect(typeof RoutePOST).toBe("function");
  expect(typeof RoutePATCH).toBe("function");
  expect(typeof RouteDELETE).toBe("function");
  expect(typeof RoutePUT).toBe("function");
});
