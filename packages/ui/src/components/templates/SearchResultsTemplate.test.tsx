import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchResultsTemplate } from "./SearchResultsTemplate";
import type { Product } from "../organisms/ProductCard";
import "../../../../../test/resetNextMocks";

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

const results: Product[] = [
  {
    id: "1",
    title: "Product 1",
    media: [{ url: "/img1.jpg", type: "image" }],
    price: 1000,
  },
  {
    id: "2",
    title: "Product 2",
    media: [{ url: "/img2.jpg", type: "image" }],
    price: 1500,
  },
];

describe("SearchResultsTemplate", () => {
  it("renders results when provided", () => {
    render(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        query=""
        page={1}
        pageCount={1}
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
        query=""
        page={1}
        pageCount={1}
      />
    );

    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("toggles pagination visibility based on pageCount", () => {
    const { rerender } = render(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        query=""
        page={1}
        pageCount={3}
      />
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();

    rerender(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        query=""
        page={1}
        pageCount={1}
      />
    );

    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("handles query changes via the search callback", async () => {
    const onQueryChange = jest.fn();
    render(
      <SearchResultsTemplate
        suggestions={["Product 1", "Product 2"]}
        results={results}
        query=""
        page={1}
        pageCount={1}
        onQueryChange={onQueryChange}
      />
    );

    const input = screen.getByPlaceholderText("Search products…");
    await userEvent.type(input, "Pro");
    const list = await screen.findByRole("list");
    await userEvent.click(within(list).getByText("Product 1"));

    expect(onQueryChange).toHaveBeenCalledWith("Product 1");
  });

  it("prefills the query when provided", () => {
    render(
      <SearchResultsTemplate
        suggestions={[]}
        results={results}
        query="Product"
        page={1}
        pageCount={1}
      />
    );

    expect(
      screen.getByPlaceholderText("Search products…")
    ).toHaveValue("Product");
  });
});
