// packages/ui/src/components/home/__tests__/HeroBanner.reexport.test.tsx
// Verify that the wrapper re-exports from HeroBanner.tsx resolve correctly

jest.mock("../HeroBanner.client", () => ({
  __esModule: true,
  default: function Mocked() {
    return null;
  },
  Named: "named-export",
}));

import DefaultExport, { Named } from "../HeroBanner";

describe("HeroBanner re-export", () => {
  test("proxies default and named exports", () => {
    expect(DefaultExport).toBeDefined();
    expect(Named).toBe("named-export");
  });
});

