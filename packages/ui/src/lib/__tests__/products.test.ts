// packages/ui/src/lib/__tests__/products.test.ts
// Ensure the re-export layer executes and proxies functions

jest.mock("@acme/platform-core/products/index", () => ({
  getProductById: jest.fn(),
  getProductBySlug: jest.fn(),
}));

import { getProductById, getProductBySlug } from "../products";

describe("lib/products re-exports", () => { // i18n-exempt: test titles are not user-facing
  test("exports functions from platform-core", () => { // i18n-exempt: test title
    expect(typeof getProductById).toBe("function");
    expect(typeof getProductBySlug).toBe("function");
  });
});
