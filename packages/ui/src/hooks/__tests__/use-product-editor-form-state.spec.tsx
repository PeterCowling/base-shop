import { act, renderHook } from "@testing-library/react";
import type { Locale } from "@acme/i18n";
import type { ProductPublication } from "@acme/types";
import * as buildProductFormData from "../../utils/buildProductFormData";
import {
  useProductEditorFormState,
  type ProductSaveResult,
} from "../useProductEditorFormState";

jest.mock("@platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: () => ({ locations: [], reload: jest.fn() }),
}));

const product: ProductPublication & { variants: Record<string, string[]> } = {
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
  variants: { size: ["m", "l"] },
};

const locales: readonly Locale[] = ["en", "de"];

describe("useProductEditorFormState save handling", () => {
  it("stores errors and leaves product unchanged when save returns errors", async () => {
    const onSave = jest
      .fn<Promise<ProductSaveResult>, [FormData]>()
      .mockResolvedValue({ errors: { title: ["required"] } });

    const { result } = renderHook(() =>
      useProductEditorFormState(product, locales, onSave)
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(result.current.errors).toEqual({ title: ["required"] });
    expect(result.current.saving).toBe(false);
    expect(result.current.product.title.en).toBe("Old EN");
  });

  it("updates product and clears errors on successful save", async () => {
    const updated = {
      ...product,
      title: { ...product.title, en: "New EN" },
    };
    const onSave = jest
      .fn<Promise<ProductSaveResult>, [FormData]>()
      .mockResolvedValue({ product: updated });

    const { result } = renderHook(() =>
      useProductEditorFormState(product, locales, onSave)
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(result.current.product.title.en).toBe("New EN");
    expect(result.current.errors).toEqual({});
    expect(result.current.saving).toBe(false);
  });
});

describe("publishTargets", () => {
  it("are passed to buildProductFormData", async () => {
    const onSave = jest
      .fn<Promise<ProductSaveResult>, [FormData]>()
      .mockResolvedValue({
        product,
      });
    const spy = jest.spyOn(buildProductFormData, "buildProductFormData");

    const { result } = renderHook(() =>
      useProductEditorFormState(product, locales, onSave)
    );

    act(() => {
      result.current.setPublishTargets(["one", "two"]);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(result.current.publishTargets).toEqual(["one", "two"]);
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      ["one", "two"],
      locales
    );
  });
});
