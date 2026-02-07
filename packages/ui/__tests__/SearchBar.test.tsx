import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SearchBarBlock from "../src/components/cms/blocks/SearchBar";
import { SearchBar } from "../src/components/molecules/SearchBar";

describe("SearchBar block", () => {
  it("fetches and displays results", async () => {
    const results = [
      { slug: "a", title: "Alpha" },
      { slug: "b", title: "Beta" },
    ];
    global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(results) });

    const { container } = render(<SearchBarBlock placeholder="Search products…" />);
    const input = screen.getByPlaceholderText("Search products…");
    fireEvent.change(input, { target: { value: "a" } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const result = await screen.findByText("Alpha");
    expect(result).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("data-token", "--color-muted-fg");
    expect(result.parentElement?.parentElement).toHaveAttribute("data-token", "--color-bg");
    expect(result.parentElement).toHaveAttribute("data-token", "--color-fg");
  });
});

describe("SearchBar component", () => {
  it("renders suggestions from mock results", async () => {
    render(<SearchBar suggestions={["apple", "banana", "cherry"]} label="Search" />);

    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "a");

    const items = await screen.findAllByRole("option");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("apple");
    expect(items[1]).toHaveTextContent("banana");
  });

  it("navigates suggestions with keyboard and selects", async () => {
    const onSelect = jest.fn();
    render(
      <SearchBar
        suggestions={["apple", "banana", "cherry"]}
        onSelect={onSelect}
        label="Search"
      />
    );

    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "a");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith("banana");
    expect(input).toHaveValue("banana");
  });
});
