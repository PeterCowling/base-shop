import React from "react";
import { act,renderHook } from "@testing-library/react";

import { useProductEditorFormState } from "../src/hooks/useProductEditorFormState";

// Mock media manager to avoid real upload/location dependencies
jest.mock("../src/hooks/useProductMediaManager", () => ({
  useProductMediaManager: () => ({
    uploader: React.createElement("div", { "data-cy": "uploader" }),
    removeMedia: jest.fn(),
    moveMedia: jest.fn(),
  }),
}));

const locales = ["en"] as const;

function createInit() {
  return {
    id: "p1",
    shop: "default",
    title: { en: "Name" },
    description: { en: "Desc" },
    price: 100,
    media: [],
    status: "active",
    variants: { color: ["red"] },
  } as any;
}

describe("useProductEditorFormState", () => {
  it("sets errors when onSave returns errors", async () => {
    const onSave = jest.fn(async () => ({ errors: { title: ["required"] } }));
    const { result } = renderHook(() =>
      useProductEditorFormState(createInit(), locales, onSave)
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault() {} } as any);
    });

    expect(onSave).toHaveBeenCalledWith(expect.any(FormData));
    expect(result.current.errors.title).toEqual(["required"]);
    expect(result.current.saving).toBe(false);
  });

  it("updates product and clears errors when onSave returns product", async () => {
    const next = { ...createInit(), title: { en: "New Name" } };
    const onSave = jest.fn(async () => ({ product: next }));
    const { result } = renderHook(() =>
      useProductEditorFormState(createInit(), locales, onSave)
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault() {} } as any);
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.product.title.en).toBe("New Name");
  });

  it("exposes variant add/remove and publishTargets setters", () => {
    const onSave = jest.fn(async () => ({ product: createInit() }));
    const { result } = renderHook(() =>
      useProductEditorFormState(createInit(), locales, onSave)
    );

    act(() => {
      result.current.addVariantValue("size");
      result.current.addVariantValue("size");
      result.current.removeVariantValue("size", 0);
      result.current.setPublishTargets(["site-1"]);
    });

    expect(result.current.publishTargets).toEqual(["site-1"]);
    // After add twice then remove index 0, there should be one empty slot left for size
    expect(result.current.product.variants.size.length).toBe(1);
  });
});

