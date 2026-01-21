import { act, renderHook } from "@testing-library/react";

import type { Locale } from "@acme/i18n";
import type { ProductPublication } from "@acme/types";

import { useProductInputs } from "../src/hooks/useProductInputs";

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
  it("handleChange processes multilingual, price, indexed and comma-separated variant fields", () => {
    const { result } = renderHook(() =>
      useProductInputs({ ...createProduct(), variants: {} }, locales)
    );

    act(() => {
      result.current.handleChange({
        target: { name: "title_en", value: "New EN" },
      } as any);
    });
    expect(result.current.product.title.en).toBe("New EN");

    act(() => {
      result.current.handleChange({
        target: { name: "price", value: "200" },
      } as any);
    });
    expect(result.current.product.price).toBe(200);

    act(() => {
      result.current.handleChange({
        target: { name: "variant_color_0", value: "red" },
      } as any);
    });
    expect(result.current.product.variants.color).toEqual(["red"]);

    act(() => {
      result.current.handleChange({
        target: { name: "variant_size", value: "m, l" },
      } as any);
    });
    expect(result.current.product.variants.size).toEqual(["m", "l"]);
  });

  it("addVariantValue and removeVariantValue update variants correctly", () => {
    const { result } = renderHook(() =>
      useProductInputs({ ...createProduct(), variants: {} }, locales)
    );

    act(() => {
      result.current.handleChange({
        target: { name: "variant_color", value: "red" },
      } as any);
    });
    expect(result.current.product.variants.color).toEqual(["red"]);

    act(() => {
      result.current.addVariantValue("color");
    });
    expect(result.current.product.variants.color).toEqual(["red", ""]);

    act(() => {
      result.current.removeVariantValue("color", 0);
    });
    expect(result.current.product.variants.color).toEqual([""]);
  });
});

