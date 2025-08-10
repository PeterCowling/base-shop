import { boxProps, cn, drawerWidthProps } from "../style";
import { parseMultilingualInput } from "../i18n";

describe("cn", () => {
  it("filters out falsey values", () => {
    expect(cn("a", "", false, null as unknown as string, undefined, "b")).toBe(
      "a b"
    );
  });
});

describe("boxProps", () => {
  it("returns classes for tailwind width/height", () => {
    const result = boxProps({
      width: "w-16",
      height: "h-32",
      padding: "p-2",
      margin: "m-3",
    });
    expect(result).toEqual({ classes: "w-16 h-32 p-2 m-3", style: {} });
  });

  it("uses style for numeric or non-tailwind values", () => {
    const result = boxProps({ width: 200, height: "100%" });
    expect(result.classes).toBe("");
    expect(result.style).toEqual({ width: 200, height: "100%" });
  });
});

describe("drawerWidthProps", () => {
  it("returns widthClass for tailwind input", () => {
    const result = drawerWidthProps("w-64");
    expect(result).toEqual({ widthClass: "w-64", style: undefined });
  });

  it("returns style for numeric width", () => {
    const result = drawerWidthProps(250);
    expect(result.widthClass).toBeUndefined();
    expect(result.style).toEqual({ width: 250 });
  });
});

describe("parseMultilingualInput", () => {
  const locales = ["en", "de", "it"] as const;
  it("detects field and locale from name", () => {
    expect(parseMultilingualInput("title_en", locales)).toEqual({
      field: "title",
      locale: "en",
    });
    expect(parseMultilingualInput("desc_de", locales)).toEqual({
      field: "desc",
      locale: "de",
    });
  });

  it("returns null for invalid input", () => {
    expect(parseMultilingualInput("foo_en", locales)).toBeNull();
  });
});
