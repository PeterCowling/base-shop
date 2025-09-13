import { act, renderHook } from "@testing-library/react";
import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
import { useProductInputs } from "../useProductInputs";

function createProduct(): ProductPublication {
  return {
    id: "p1",
    sku: "sku1",
    title: { en: "Old EN", de: "Old DE" },
    description: { en: "Desc EN", de: "Desc DE" },
    price: 100,
    currency: "EUR",
    media: [],
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    shop: "shop",
    status: "draft",
    row_version: 1,
  };
}

const locales: readonly Locale[] = ["en", "de"];

describe("useProductInputs", () => {
  it("handleChange processes multilingual and comma-separated variant fields", () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() =>
      useProductInputs(initial, locales)
    );

    act(() => {
      result.current.handleChange({
        target: { name: "title_en", value: "New EN" },
      } as any);
    });
    expect(result.current.product.title.en).toBe("New EN");

    act(() => {
      result.current.handleChange({
        target: { name: "variant_color_0", value: "red" },
      } as any);
    });
    act(() => {
      result.current.handleChange({
        target: { name: "variant_size", value: "m, l" },
      } as any);
    });

    expect(result.current.product).toEqual({
      ...initial,
      title: { en: "New EN", de: "Old DE" },
      variants: { color: ["red"], size: ["m", "l"] },
    });
  });

  it("handleChange updates price with numeric and non-numeric input", () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() =>
      useProductInputs(initial, locales)
    );

    act(() => {
      result.current.handleChange({
        target: { name: "price", value: "200" },
      } as any);
    });
    expect(result.current.product).toEqual({
      ...initial,
      price: 200,
    });

    act(() => {
      result.current.handleChange({
        target: { name: "price", value: "abc" },
      } as any);
    });
    expect(result.current.product.price).toBeNaN();
    const { price, ...rest } = result.current.product;
    const { price: _p, ...expectedRest } = { ...initial, variants: {} };
    expect(rest).toEqual(expectedRest);
  });

  it("handleChange updates description field", () => {
    const { result } = renderHook(() =>
      useProductInputs({ ...createProduct(), variants: {} }, locales)
    );

    act(() => {
      result.current.handleChange({
        target: { name: "desc_en", value: "New Description" },
      } as any);
    });

    expect(result.current.product.description.en).toBe("New Description");
  });

  it("handleChange sets empty variant array value", () => {
    const { result } = renderHook(() =>
      useProductInputs({ ...createProduct(), variants: {} }, locales)
    );

    act(() => {
      result.current.handleChange({
        target: { name: "variant_color", value: "" },
      } as any);
    });

    expect(result.current.product.variants.color).toEqual([""]);
  });

  it("handleChange ignores unknown fields", () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() => useProductInputs(initial, locales));

    act(() => {
      result.current.handleChange({
        target: { name: "unknown_field", value: "some" },
      } as any);
    });

    expect(result.current.product).toEqual(initial);
  });

  it("addVariantValue/removeVariantValue and indexed variant inputs mutate product", () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() =>
      useProductInputs(initial, locales)
    );

    act(() => {
      result.current.addVariantValue("color");
    });
    act(() => {
      result.current.handleChange({
        target: { name: "variant_color_0", value: "red" },
      } as any);
    });
    act(() => {
      result.current.addVariantValue("color");
    });
    act(() => {
      result.current.handleChange({
        target: { name: "variant_color_1", value: "blue" },
      } as any);
    });
    expect(result.current.product).toEqual({
      ...initial,
      variants: { color: ["red", "blue"] },
    });

    act(() => {
      result.current.removeVariantValue("color", 0);
    });
    expect(result.current.product).toEqual({
      ...initial,
      variants: { color: ["blue"] },
    });
  });
});

