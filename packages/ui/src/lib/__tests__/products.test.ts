// packages/ui/src/lib/__tests__/products.test.ts
// Ensure the re-export layer executes and proxies functions

jest.mock("@acme/platform-core/products/index", () => ({
  getProductById: jest.fn(),
  getProductBySlug: jest.fn(),
}));

import { getProductById, getProductBySlug } from "../products";

describe("lib/products re-exports", () => {
  test("exports functions from platform-core", () => {
    expect(typeof getProductById).toBe("function");
    expect(typeof getProductBySlug).toBe("function");
  });
});

