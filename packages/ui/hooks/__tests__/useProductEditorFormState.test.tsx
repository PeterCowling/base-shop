import type { Locale, ProductPublication } from "@platform-core/products";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { useProductEditorFormState } from "../useProductEditorFormState";

jest.mock("../useImageUpload", () => ({
  useImageUpload: () => ({
    file: null,
    setFile: jest.fn(),
    uploader: React.createElement("div"),
  }),
}));

jest.mock("../usePublishLocations", () => ({
  usePublishLocations: () => ({ locations: [], reload: jest.fn() }),
}));

const product: ProductPublication = {
  id: "p1",
  sku: "sku1",
  title: { en: "Old EN", de: "Old DE", it: "Old IT" },
  description: { en: "Desc EN", de: "Desc DE", it: "Desc IT" },
  price: 100,
  currency: "EUR",
  images: [],
  created_at: "2023-01-01",
  updated_at: "2023-01-01",
  shop: "shop",
  status: "draft",
  row_version: 1,
};

const locales: readonly Locale[] = ["en", "de"];

function Wrapper({ onSave }: { onSave: (fd: FormData) => Promise<any> }) {
  const state = useProductEditorFormState(product, locales, onSave);
  return React.createElement(
    "form",
    { onSubmit: state.handleSubmit },
    React.createElement("input", {
      "data-testid": "title-en",
      name: "title_en",
      value: state.product.title.en,
      onChange: state.handleChange,
    }),
    React.createElement("input", {
      "data-testid": "price",
      name: "price",
      value: state.product.price,
      onChange: state.handleChange,
    }),
    React.createElement("button", { type: "submit" }, "save")
  );
}

describe("useProductEditorFormState", () => {
  it("handleChange updates multilingual fields and price", () => {
    const onSave = jest.fn();
    render(React.createElement(Wrapper, { onSave }));
    const title = screen.getByTestId("title-en") as HTMLInputElement;
    const price = screen.getByTestId("price") as HTMLInputElement;

    fireEvent.change(title, { target: { value: "New" } });
    fireEvent.change(price, { target: { value: "200" } });

    expect(title.value).toBe("New");
    expect(price.value).toBe("200");
  });

  it("handleSubmit calls save callback with generated FormData", async () => {
    const onSave = jest.fn(async () => ({ product }));
    render(React.createElement(Wrapper, { onSave }));
    fireEvent.change(screen.getByTestId("title-en"), {
      target: { value: "New" },
    });
    fireEvent.change(screen.getByTestId("price"), { target: { value: "200" } });
    fireEvent.click(screen.getByText("save"));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const fd = onSave.mock.calls[0][0] as FormData;
    const entries = Array.from(fd.entries());
    expect(entries).toEqual(
      expect.arrayContaining([
        ["id", "p1"],
        ["title_en", "New"],
        ["desc_en", "Desc EN"],
        ["title_de", "Old DE"],
        ["desc_de", "Desc DE"],
        ["price", "200"],
        ["publish", ""],
      ])
    );
  });
});
