// apps/skylar/src/lib/__tests__/routes.test.ts
import { localizedPath } from "../routes";

describe("localizedPath", () => {
  it("normalizes the English home route to /en", () => {
    expect(localizedPath("en", "home")).toBe("/en");
  });

  it("returns English section paths with the /en prefix", () => {
    expect(localizedPath("en", "realEstate")).toBe("/en/real-estate");
    expect(localizedPath("en", "products")).toBe("/en/products");
  });

  it("prefixes non-English paths with the locale code", () => {
    expect(localizedPath("it", "people")).toBe("/it/people");
    expect(localizedPath("zh", "products")).toBe("/zh/products");
  });

  it("strips duplicate slashes from computed paths", () => {
    // The home path is the trickiest case because its segment is blank.
    expect(localizedPath("zh", "home")).toBe("/zh");
  });
});

