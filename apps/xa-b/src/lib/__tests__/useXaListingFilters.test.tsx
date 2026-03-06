import * as React from "react";
import { act, render, waitFor } from "@testing-library/react";

import { useXaListingFilters } from "../useXaListingFilters";

let currentQuery = "";
let currentPathname = "/women";
const pushMock = jest.fn((href: string) => {
  const queryIndex = href.indexOf("?");
  currentQuery = queryIndex >= 0 ? href.slice(queryIndex + 1) : "";
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...(args as [string])) }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(currentQuery),
}));

type HookValue = ReturnType<typeof useXaListingFilters>;

const productOne = {
  id: "p1",
  slug: "studio-jacket",
  title: "Studio Jacket",
  brand: "atelier-x",
  collection: "outerwear",
  price: 200,
  createdAt: "2026-03-01T00:00:00.000Z",
  popularity: 20,
  status: "live",
  sizes: ["S", "M"],
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "outerwear",
    color: ["black"],
    material: ["wool"],
  },
} as any;

const productTwo = {
  id: "p2",
  slug: "city-coat",
  title: "City Coat",
  brand: "atelier-x",
  collection: "outerwear",
  price: 340,
  createdAt: "2026-03-01T00:00:00.000Z",
  popularity: 10,
  status: "live",
  sizes: ["M"],
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "outerwear",
    color: ["black"],
    material: ["wool"],
  },
} as any;

const productThree = {
  id: "p3",
  slug: "archive-knit",
  title: "Archive Knit",
  brand: "other-label",
  collection: "knitwear",
  price: 180,
  createdAt: "2025-12-01T00:00:00.000Z",
  popularity: 5,
  status: "out_of_stock",
  sizes: ["S"],
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "knitwear",
    color: ["cream"],
    material: ["cotton"],
  },
} as any;

function Harness({ onSnapshot }: { onSnapshot: (value: HookValue) => void }) {
  const value = useXaListingFilters({
    products: [productOne, productTwo, productThree],
    category: "clothing",
    showTypeFilter: true,
    cart: {},
    filtersOpen: true,
    currency: "EUR",
  });

  React.useEffect(() => {
    onSnapshot(value);
  }, [onSnapshot, value]);

  return null;
}

describe("useXaListingFilters", () => {
  beforeEach(() => {
    currentQuery = "";
    currentPathname = "/women";
    pushMock.mockClear();
  });

  it("filters products from applied query params and exposes applied chips", async () => {
    currentQuery =
      "availability=in-stock&price%5Bmin%5D=100&price%5Bmax%5D=300&f%5Bdesigner%5D=atelier-x&window=week";

    let latest: HookValue | null = null;
    render(<Harness onSnapshot={(value) => (latest = value)} />);

    await waitFor(() => {
      expect(latest).not.toBeNull();
      expect(latest?.filteredProducts.map((product) => product.id)).toEqual(["p1"]);
      expect(latest?.hasAppliedFilters).toBe(true);
      expect(latest?.appliedChips.some((chip) => chip.label.startsWith("Price:"))).toBe(true);
    });
  });

  it("applies draft filters into query and strips window when new-in is disabled", async () => {
    currentQuery = "window=week";

    let latest: HookValue | null = null;
    render(<Harness onSnapshot={(value) => (latest = value)} />);

    await waitFor(() => {
      expect(latest).not.toBeNull();
    });

    act(() => {
      latest?.setDraftNewIn(false);
      latest?.setDraftInStock(true);
      latest?.setDraftMin("120");
      latest?.setDraftMax("250");
      latest?.toggleDraftValue("designer", "atelier-x");
    });

    act(() => {
      latest?.applyFilters();
    });

    const pushedHref = pushMock.mock.calls.at(-1)?.[0] as string;
    const pushedQuery = pushedHref.split("?")[1] ?? "";
    const params = new URLSearchParams(pushedQuery);

    expect(params.get("availability")).toBe("in-stock");
    expect(params.get("new-in")).toBeNull();
    expect(params.get("window")).toBeNull();
    expect(params.get("price[min]")).toBe("120");
    expect(params.get("price[max]")).toBe("250");
    expect(params.getAll("f[designer]")).toEqual(["atelier-x"]);
  });

  it("updates sort in query and removes sort when newest is applied", async () => {
    let latest: HookValue | null = null;
    const { rerender } = render(<Harness onSnapshot={(value) => (latest = value)} />);

    await waitFor(() => {
      expect(latest).not.toBeNull();
    });

    act(() => {
      latest?.applySort("price-asc");
    });

    expect(pushMock.mock.calls.at(-1)?.[0]).toBe("/women?sort=price-asc");

    rerender(<Harness onSnapshot={(value) => (latest = value)} />);
    act(() => {
      latest?.applySort("newest");
    });

    expect(pushMock.mock.calls.at(-1)?.[0]).toBe("/women");
  });

  it("removes applied chips and clears applied filters from query", async () => {
    currentQuery = "new-in=1&price%5Bmin%5D=100&price%5Bmax%5D=200&f%5Bdesigner%5D=atelier-x";

    let latest: HookValue | null = null;
    render(<Harness onSnapshot={(value) => (latest = value)} />);

    await waitFor(() => {
      expect(latest?.appliedChips.length).toBeGreaterThan(0);
    });

    const newInChip = latest?.appliedChips.find((chip) => chip.label === "New in");
    act(() => {
      newInChip?.onRemove();
    });

    const newInRemoved = new URLSearchParams((pushMock.mock.calls.at(-1)?.[0] as string).split("?")[1] ?? "");
    expect(newInRemoved.get("new-in")).toBeNull();

    act(() => {
      latest?.clearAppliedFilters();
    });

    const clearedHref = pushMock.mock.calls.at(-1)?.[0] as string;
    expect(clearedHref).toBe("/women");
  });
});
