
import "@testing-library/jest-dom";
import {
  resolveGuideContentKeysForMatches,
  resolveNamespacesForMatches,
} from "@/next/i18nNamespaceSelector";

describe("i18n namespace selection (how-to guide routes)", () => {
  it("includes guide namespaces for routes/how-to-get-here/* wrappers", () => {
    const namespaces = resolveNamespacesForMatches([
      {
        file: "routes/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette.tsx",
      } as any,
    ]);

    expect(namespaces).toContain("guides");
    expect(namespaces).toContain("guidesFallback");
    expect(namespaces).toContain("assistanceCommon");
  });

  it("collects guide keys from loader data to hydrate pruned guides bundles", () => {
    const keys = resolveGuideContentKeysForMatches([
      {
        file: "routes/how-to-get-here/chiesa-nuova-bar-internazionale-to-hostel-brikette.tsx",
        data: { guide: "chiesaNuovaArrivals" },
      } as any,
    ]);

    expect(keys).toContain("chiesaNuovaArrivals");
  });
});
