/** @jest-environment jsdom */

import * as React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { EditProductFilterSelector } from "../EditProductFilterSelector.client";

const mockT = jest.fn((key: string) => key);

jest.mock("../../../lib/uploaderI18n.client", () => ({
  useUploaderI18n: () => ({ t: mockT }),
}));

function makeProduct(overrides: {
  slug?: string;
  title?: string;
  brandHandle?: string;
  collectionHandle?: string;
} = {}): CatalogProductDraftInput {
  return {
    slug: overrides.slug ?? "product-1",
    title: overrides.title ?? "Product 1",
    brandHandle: overrides.brandHandle ?? "brand-a",
    collectionHandle: overrides.collectionHandle ?? "collection-x",
    sizes: [],
    taxonomy: { color: "" },
  } as unknown as CatalogProductDraftInput;
}

const FIVE_PRODUCTS: CatalogProductDraftInput[] = [
  makeProduct({ slug: "p1", title: "Product 1", brandHandle: "brand-a", collectionHandle: "col-x" }),
  makeProduct({ slug: "p2", title: "Product 2", brandHandle: "brand-a", collectionHandle: "col-y" }),
  makeProduct({ slug: "p3", title: "Product 3", brandHandle: "brand-a", collectionHandle: "col-z" }),
  makeProduct({ slug: "p4", title: "Product 4", brandHandle: "brand-b", collectionHandle: "col-x" }),
  makeProduct({ slug: "p5", title: "Product 5", brandHandle: "brand-b", collectionHandle: "col-y" }),
];

describe("EditProductFilterSelector", () => {
  beforeEach(() => {
    mockT.mockReset();
    mockT.mockImplementation((key: string) => key);
  });

  it("TC-01: 5 products across 2 brands, showAll=false → Show all products button visible below New Product button", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);
    expect(screen.getByTestId("edit-filter-show-all")).toBeTruthy();
  });

  it("TC-02: Click Show all products → all 5 products listed with brand+collection subtitles → cascade selects hidden", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));

    for (const p of FIVE_PRODUCTS) {
      expect(screen.getByTestId(`edit-filter-product-all-${p.slug}`)).toBeTruthy();
    }
    // Subtitle format: brandHandle/collectionHandle
    expect(screen.getByText("brand-a/col-x")).toBeTruthy();
    // Filter select cascade hidden
    expect(screen.queryByTestId("edit-filter-brand")).toBeNull();
  });

  it("TC-03: In show-all mode, click a product → onSelect called with correct product → showAll resets to false", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));

    const target = FIVE_PRODUCTS[2]!; // p3
    fireEvent.click(screen.getByTestId(`edit-filter-product-all-${target.slug}`));

    expect(onSelect).toHaveBeenCalledWith(target);
    // showAll reset to false: show-all button visible again
    expect(screen.getByTestId("edit-filter-show-all")).toBeTruthy();
  });

  it("TC-04: In show-all mode, click Back to filter → showAll false → onNew NOT called → criteria unchanged", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));
    fireEvent.click(screen.getByTestId("edit-filter-hide-all"));

    // showAll reset to false
    expect(screen.getByTestId("edit-filter-show-all")).toBeTruthy();
    expect(onNew).not.toHaveBeenCalled();
  });

  it("TC-05: Show-all mode renders from props.products directly — criteria does not filter the list", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));

    // All 5 products appear — show-all uses props.products (unfiltered), not the filtered subset
    const productButtons = FIVE_PRODUCTS.map((p) =>
      screen.getByTestId(`edit-filter-product-all-${p.slug}`)
    );
    expect(productButtons).toHaveLength(5);
  });

  it("TC-06: Render with 0 products → Show all products button NOT rendered", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={[]} onSelect={onSelect} onNew={onNew} />);
    expect(screen.queryByTestId("edit-filter-show-all")).toBeNull();
  });

  it("TC-07: Products with empty brandHandle render subtitle as — / —", () => {
    const bare = makeProduct({ slug: "bare", title: "Bare Product", brandHandle: "", collectionHandle: "" });
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(
      <EditProductFilterSelector products={[...FIVE_PRODUCTS, bare]} onSelect={onSelect} onNew={onNew} />
    );

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));

    const btn = screen.getByTestId("edit-filter-product-all-bare");
    expect(btn.textContent).toContain("—/—");
  });

  it("TC-08: zh locale → Show all products shows 显示全部商品 → Back to filter shows 返回筛选", () => {
    const zhMap: Record<string, string> = {
      editFilterShowAll: "显示全部商品",
      editFilterHideAll: "返回筛选",
    };
    mockT.mockImplementation((key: string) => zhMap[key] ?? key);

    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);

    expect(screen.getByTestId("edit-filter-show-all").textContent).toBe("显示全部商品");

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));
    expect(screen.getByTestId("edit-filter-hide-all").textContent).toBe("返回筛选");
  });

  it("TC-09: data-testid edit-filter-show-all and edit-filter-hide-all present on correct buttons", () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={FIVE_PRODUCTS} onSelect={onSelect} onNew={onNew} />);

    // Before entering show-all: show-all button present, hide-all absent
    expect(screen.getByTestId("edit-filter-show-all")).toBeTruthy();
    expect(screen.queryByTestId("edit-filter-hide-all")).toBeNull();

    fireEvent.click(screen.getByTestId("edit-filter-show-all"));

    // After entering show-all: hide-all button present, show-all absent
    expect(screen.getByTestId("edit-filter-hide-all")).toBeTruthy();
    expect(screen.queryByTestId("edit-filter-show-all")).toBeNull();
  });

  it("TC-10: 1 product in catalog, show-all mode active → auto-select useEffect fires → showAll remains true", () => {
    const solo = makeProduct({ slug: "solo", title: "Solo Product" });
    const onSelect = jest.fn();
    const onNew = jest.fn();
    render(<EditProductFilterSelector products={[solo]} onSelect={onSelect} onNew={onNew} />);

    // Auto-select fires on mount when only one product matches
    expect(onSelect).toHaveBeenCalledWith(solo);

    // Enter show-all mode
    fireEvent.click(screen.getByTestId("edit-filter-show-all"));

    // showAll remains true — auto-select did not reset it
    expect(screen.getByTestId("edit-filter-hide-all")).toBeTruthy();
    expect(screen.queryByTestId("edit-filter-show-all")).toBeNull();
  });
});
