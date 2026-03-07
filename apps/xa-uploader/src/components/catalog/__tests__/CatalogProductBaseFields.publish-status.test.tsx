/** @jest-environment jsdom */

import * as React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { CatalogProductBaseFields } from "../CatalogProductBaseFields.client";

jest.mock("../../../lib/uploaderI18n.client", () => ({
  useUploaderI18n: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../lib/catalogBrandRegistry", () => ({
  computePopularity: () => 0,
  CUSTOM_BRAND_HANDLE: "__custom__",
  CUSTOM_COLLECTION_HANDLE: "__custom__",
  findBrand: (handle: string) =>
    handle === "hermes"
      ? {
          handle: "hermes",
          name: "Hermes",
          collections: [
            {
              handle: "kelly",
              title: "Kelly",
              description: "Kelly description",
            },
          ],
        }
      : null,
  findCollection: (brandHandle: string, collectionHandle: string) =>
    brandHandle === "hermes" && collectionHandle === "kelly"
      ? {
          handle: "kelly",
          title: "Kelly",
          description: "Kelly description",
        }
      : null,
  findCollectionColors: () => [],
  findCollectionDefaults: () => ({}),
  findCollectionHardwareColors: () => [],
  findCollectionInteriorColors: () => [],
  findCollectionMaterials: () => [],
  findCollectionSizes: () => [],
  XA_BRAND_REGISTRY: [{ handle: "hermes", name: "Hermes", collections: [] }],
  ZH_CATALOG_LABELS: {},
}));

jest.mock("../RegistryCheckboxGrid.client", () => ({
  RegistryCheckboxGrid: () => null,
}));

const BASE_DRAFT: CatalogProductDraftInput = {
  id: "p1",
  slug: "studio-jacket",
  title: "Studio jacket",
  brandHandle: "atelier-x",
  collectionHandle: "outerwear",
  collectionTitle: "Outerwear",
  price: "189.00",
  description: "A structured layer.",
  createdAt: "2025-12-01T12:00:00.000Z",
  popularity: "0",
  sizes: "S|M|L",
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

describe("CatalogProductBaseFields — StatusSelect (TASK-03 TC-04)", () => {
  it("TC-04: StatusSelect has draft and out_of_stock options but no live option", () => {
    render(
      <CatalogProductBaseFields
        selectedSlug="studio-jacket"
        draft={BASE_DRAFT}
        fieldErrors={{}}
        sections={["identity", "taxonomy"]}
        onChange={jest.fn()}
      />,
    );

    const options = screen.queryAllByRole("option").map((opt) => (opt as HTMLOptionElement).value);
    expect(options).toContain("draft");
    expect(options).toContain("out_of_stock");
    expect(options).not.toContain("live");
  });

  it("resets the collection selector when the draft clears collection state", () => {
    const { rerender } = render(
      <CatalogProductBaseFields
        selectedSlug="studio-jacket"
        draft={{
          ...BASE_DRAFT,
          brandHandle: "hermes",
          brandName: "Hermes",
          collectionHandle: "kelly",
          collectionTitle: "Kelly",
        }}
        fieldErrors={{}}
        sections={["identity", "taxonomy"]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId("catalog-field-collection-select")).toHaveValue("kelly");

    rerender(
      <CatalogProductBaseFields
        selectedSlug={null}
        draft={{
          ...BASE_DRAFT,
          brandHandle: "hermes",
          brandName: "Hermes",
          collectionHandle: "",
          collectionTitle: "",
          sizes: "",
        }}
        fieldErrors={{}}
        sections={["identity", "taxonomy"]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId("catalog-field-brand-select")).toHaveValue("hermes");
    expect(screen.getByTestId("catalog-field-collection-select")).toHaveValue("");
  });
});
