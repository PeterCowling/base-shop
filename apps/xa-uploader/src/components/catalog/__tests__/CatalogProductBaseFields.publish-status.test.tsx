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
  findBrand: () => null,
  findCollection: () => null,
  findCollectionColors: () => [],
  findCollectionDefaults: () => ({}),
  findCollectionHardwareColors: () => [],
  findCollectionInteriorColors: () => [],
  findCollectionMaterials: () => [],
  findCollectionSizes: () => [],
  XA_BRAND_REGISTRY: [],
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
});
