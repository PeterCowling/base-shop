// packages/ui/src/components/home/__tests__/HeroBanner.reexport.test.tsx
// Verify that the wrapper re-exports from HeroBanner.tsx resolve correctly

import DefaultExport, { type Slide } from "../HeroBanner";

jest.mock("../HeroBanner.client", () => ({
  __esModule: true,
  default: function Mocked() {
    return null;
  },
  Slide: {},
}));

describe("HeroBanner re-export", () => {
  test("proxies default and type exports", () => {
    expect(DefaultExport).toBeDefined();
    // Type export Slide should be available (verified by type import above)
    const _slideType: Slide | undefined = undefined;
    expect(_slideType).toBeUndefined();
  });
});

