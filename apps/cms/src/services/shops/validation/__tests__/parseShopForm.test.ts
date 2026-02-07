import {
  parseFilterMappings,
  parseLocaleOverrides,
  parsePriceOverrides,
} from "../../formData";
import { parseShopForm } from "../parseShopForm";

jest.mock("../../formData", () => ({
  parseFilterMappings: jest.fn(() => '{"f":"m"}'),
  parsePriceOverrides: jest.fn(() => '{"p":1}'),
  parseLocaleOverrides: jest.fn(() => '{"en":"L"}'),
}));

describe("parseShopForm", () => {
  beforeEach(() => {
    (parseFilterMappings as jest.Mock).mockClear();
    (parsePriceOverrides as jest.Mock).mockClear();
    (parseLocaleOverrides as jest.Mock).mockClear();
  });

  it("filters extraneous entries", () => {
    const fd = new FormData();
    fd.set("id", "1");
    fd.set("name", "Shop");
    fd.set("themeId", "theme");
    fd.append("filterMappingsKey", "color");
    fd.append("filterMappingsValue", "red");
    fd.append("priceOverridesKey", "sku");
    fd.append("priceOverridesValue", "10");
    fd.append("localeOverridesKey", "en");
    fd.append("localeOverridesValue", "EN");

    const result = parseShopForm(fd);
    expect(result.data).toBeDefined();
    expect((result.data as any).filterMappingsKey).toBeUndefined();
    expect((result.data as any).priceOverridesValue).toBeUndefined();
    expect((result.data as any).localeOverridesKey).toBeUndefined();
  });

  it("handles theme defaults, tracking providers and dependent parsers", () => {
    const fd = new FormData();
    fd.set("id", "1");
    fd.set("name", "Shop");
    fd.set("themeId", "theme");
    fd.set("themeDefaults", '{"foo":1}');
    fd.append("trackingProviders", "a");
    fd.append("trackingProviders", "b");

    const result = parseShopForm(fd);
    expect(result.data?.themeDefaults).toEqual({ foo: 1 });
    expect(result.data?.themeOverrides).toEqual({});
    expect(result.data?.trackingProviders).toEqual(["a", "b"]);
    expect(result.data?.filterMappings).toEqual({ f: "m" });
    expect(result.data?.priceOverrides).toEqual({ p: 1 });
    expect(result.data?.localeOverrides).toEqual({ en: "L" });
    expect(parseFilterMappings).toHaveBeenCalled();
    expect(parsePriceOverrides).toHaveBeenCalled();
    expect(parseLocaleOverrides).toHaveBeenCalled();
  });
});
