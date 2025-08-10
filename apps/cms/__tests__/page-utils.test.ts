// apps/cms/__tests__/page-utils.test.ts
import { toPageInfo } from "../src/app/cms/wizard/utils/page-utils";

describe("page utils", () => {
  it("fills locales for missing fields", () => {
    const info = toPageInfo({ slug: "test" });
    expect(Object.keys(info.title)).toEqual(["en", "de", "it"]);
    expect(Object.keys(info.description)).toEqual(["en", "de", "it"]);
    expect(Object.keys(info.image)).toEqual(["en", "de", "it"]);
  });
});
