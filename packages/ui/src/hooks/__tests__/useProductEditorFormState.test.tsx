// packages/ui/hooks/__tests__/useProductEditorFormState.test.tsx

import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  useProductEditorFormState,
  type ProductSaveResult,
} from "../useProductEditorFormState";

/* ------------------------------------------------------------------ *
 *  Mock the file-upload and publish-location hooks (no network, no DOM)
 * ------------------------------------------------------------------ */
jest.mock("../useFileUpload", () => ({
  useFileUpload: () => ({
    pendingFile: null,
    altText: "",
    setAltText: jest.fn(),
    uploader: <div />,
  }),
}));

jest.mock("@platform-core/hooks/usePublishLocations", () => ({
  usePublishLocations: () => ({ locations: [], reload: jest.fn() }),
}));

/* ------------------------------------------------------------------ *
 *  Shared fixtures
 * ------------------------------------------------------------------ */
const product: ProductPublication & { variants: Record<string, string[]> } = {
  id: "p1",
  sku: "sku1",
  title: { en: "Old EN", de: "Old DE", it: "Old IT" },
  description: { en: "Desc EN", de: "Desc DE", it: "Desc IT" },
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

/* ------------------------------------------------------------------ *
 *  Test wrapper component
 * ------------------------------------------------------------------ */
function Wrapper({
  onSave,
}: {
  onSave: (fd: FormData) => Promise<ProductSaveResult>;
}) {
  const state = useProductEditorFormState(product, locales, onSave);

  return (
    <form onSubmit={state.handleSubmit}>
      <input
        data-cy="title-en"
        name="title_en"
        value={state.product.title.en}
        onChange={state.handleChange}
      />
      <input
        data-cy="price"
        name="price"
        value={state.product.price}
        onChange={state.handleChange}
      />
      <input
        data-cy="variant-size"
        name="variant_size"
        value={state.product.variants.size.join(",")}
        onChange={state.handleChange}
      />
      <button type="submit">save</button>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 *  Tests
 * ------------------------------------------------------------------ */
describe("useProductEditorFormState", () => {
  it("handleChange updates multilingual, price and variant fields", () => {
    const onSave = jest.fn().mockResolvedValue({ product });
    render(<Wrapper onSave={onSave} />);

    fireEvent.change(screen.getByTestId("title-en"), {
      target: { value: "New" },
    });
    fireEvent.change(screen.getByTestId("price"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByTestId("variant-size"), {
      target: { value: "xl" },
    });

    expect((screen.getByTestId("title-en") as HTMLInputElement).value).toBe(
      "New"
    );
    expect((screen.getByTestId("price") as HTMLInputElement).value).toBe("200");
    expect(
      (screen.getByTestId("variant-size") as HTMLInputElement).value
    ).toBe("xl");
  });

  it("handleSubmit calls save callback with generated FormData", async () => {
    const onSave = jest
      .fn<Promise<ProductSaveResult>, [FormData]>()
      .mockResolvedValue({ product });

    render(<Wrapper onSave={onSave} />);

    fireEvent.change(screen.getByTestId("title-en"), {
      target: { value: "New" },
    });
    fireEvent.change(screen.getByTestId("price"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByTestId("variant-size"), {
      target: { value: "xl" },
    });
    fireEvent.click(screen.getByText("save"));

    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const fd = onSave.mock.calls[0]![0];
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
        ["variant_size", "xl"],
      ])
    );
  });
});
