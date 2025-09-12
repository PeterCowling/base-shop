import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SearchResultsTemplate } from "../SearchResultsTemplate";
import type { SKU } from "@acme/types";
import "../../../../../../test/resetNextMocks";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, jest.fn()],
}));

const results: SKU[] = [
  {
    id: "1",
    slug: "product-1",
    title: "Product 1",
    price: 1000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img1.jpg", type: "image" }],
    sizes: [],
    description: "",
  },
  {
    id: "2",
    slug: "product-2",
    title: "Product 2",
    price: 1500,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img2.jpg", type: "image" }],
    sizes: [],
    description: "",
  },
];

describe("SearchResultsTemplate", () => {
  it("renders results when provided", () => {
    render(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        page={1}
        pageCount={1}
        query=""
      />
    );

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
    expect(screen.queryByText("No results found.")).not.toBeInTheDocument();
  });

  it("shows empty state when no results", () => {
    render(
      <SearchResultsTemplate
        suggestions={[]}
        results={[]}
        page={1}
        pageCount={1}
        query=""
      />
    );

    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("renders skeleton placeholders matching maxItems when loading", () => {
    const maxItems = 4;
    render(
      <SearchResultsTemplate
        suggestions={[]}
        results={[]}
        page={1}
        pageCount={1}
        isLoading
        maxItems={maxItems}
        query=""
      />
    );

    const loading = screen.getByTestId("search-results-loading");
    expect(loading).toBeInTheDocument();
    expect(loading.childElementCount).toBe(maxItems);
    expect(screen.queryByText("No results found.")).not.toBeInTheDocument();
  });

  it("toggles pagination visibility based on pageCount", () => {
    const { rerender } = render(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        page={1}
        pageCount={3}
        query=""
      />
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();

    rerender(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        page={1}
        pageCount={1}
        query=""
      />
    );

    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("fires onPageChange when pagination control is used", async () => {
    const onPageChange = jest.fn();
    render(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        page={1}
        pageCount={3}
        onPageChange={onPageChange}
        query=""
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("handles query changes via the search callback", async () => {
    const onQueryChange = jest.fn();
    render(
      <SearchResultsTemplate
        suggestions={["Product 1", "Product 2"]}
        results={results}
        page={1}
        pageCount={1}
        onQueryChange={onQueryChange}
        query=""
      />
    );

    const input = screen.getByPlaceholderText("Search products…");
    await userEvent.type(input, "Pro");
    const list = await screen.findByRole("listbox");
    await userEvent.click(within(list).getByText("Product 1"));

    expect(onQueryChange).toHaveBeenCalledWith("Product 1");
  });
});
