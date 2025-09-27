import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
import { useProductInputs } from "../useProductInputs";

// i18n-exempt: test-only product fixture strings
function createProduct(): ProductPublication {
  return {
    id: "p1",
    sku: "sku1",
    title: { en: "Old EN", de: "Old DE" }, // i18n-exempt
    description: { en: "Desc EN", de: "Desc DE" }, // i18n-exempt
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

type InputChange = ChangeEvent<HTMLInputElement>;
const change = (name: string, value: string): InputChange =>
  ({ target: { name, value } } as unknown as InputChange);

describe("useProductInputs", () => {
  it(
    "handleChange processes multilingual and comma-separated variant fields", // i18n-exempt: test name
    () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() =>
      useProductInputs(initial, locales)
    );

    act(() => {
      result.current.handleChange(change("title_en", "New EN")); // i18n-exempt
    });
    expect(result.current.product.title.en).toBe("New EN");

    act(() => {
      result.current.handleChange(change("variant_color_0", "red")); // i18n-exempt
    });
    act(() => {
      result.current.handleChange(change("variant_size", "m, l")); // i18n-exempt
    });

    expect(result.current.product).toEqual({
      ...initial,
      title: { en: "New EN", de: "Old DE" }, // i18n-exempt
      variants: { color: ["red"], size: ["m", "l"] }, // i18n-exempt
    });
  }
  );

  it(
    "handleChange updates price with numeric and non-numeric input", // i18n-exempt
    () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() =>
      useProductInputs(initial, locales)
    );

    act(() => {
      result.current.handleChange(change("price", "200"));
    });
    expect(result.current.product).toEqual({
      ...initial,
      price: 200,
    });

    act(() => {
      result.current.handleChange(change("price", "abc"));
    });
    expect(result.current.product.price).toBeNaN();
    const { price: _price, ...rest } = result.current.product; // rename to satisfy unused-var rule
    const { price: _expectedPrice, ...expectedRest } = { ...initial, variants: {} };
    expect(rest).toEqual(expectedRest);
  }
  );

  it("handleChange updates description field", () => { // i18n-exempt: test name
    const { result } = renderHook(() =>
      useProductInputs({ ...createProduct(), variants: {} }, locales)
    );

    act(() => {
      result.current.handleChange(change("desc_en", "New Description")); // i18n-exempt
    });

    expect(result.current.product.description.en).toBe("New Description");
  });

  it("handleChange sets empty variant array value", () => { // i18n-exempt
    const { result } = renderHook(() =>
      useProductInputs({ ...createProduct(), variants: {} }, locales)
    );

    act(() => {
      result.current.handleChange(change("variant_color", ""));
    });

    expect(result.current.product.variants.color).toEqual([""]);
  });

  it("handleChange ignores unknown fields", () => { // i18n-exempt
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() => useProductInputs(initial, locales));

    act(() => {
      result.current.handleChange(change("unknown_field", "some")); // i18n-exempt
    });

    expect(result.current.product).toEqual(initial);
  });

  it(
    "addVariantValue/removeVariantValue and indexed variant inputs mutate product", // i18n-exempt
    () => {
    const initial = { ...createProduct(), variants: {} };
    const { result } = renderHook(() =>
      useProductInputs(initial, locales)
    );

    act(() => {
      result.current.addVariantValue("color");
    });
    act(() => {
      result.current.handleChange(change("variant_color_0", "red")); // i18n-exempt
    });
    act(() => {
      result.current.addVariantValue("color");
    });
    act(() => {
      result.current.handleChange(change("variant_color_1", "blue")); // i18n-exempt
    });
    expect(result.current.product).toEqual({
      ...initial,
      variants: { color: ["red", "blue"] }, // i18n-exempt
    });

    act(() => {
      result.current.removeVariantValue("color", 0);
    });
    expect(result.current.product).toEqual({
      ...initial,
      variants: { color: ["blue"] }, // i18n-exempt
    });
  }
  );
});
