import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  it("calls onSearch when pressing Enter", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "hello{enter}");
    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("calls onSearch when input loses focus", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "world");
    fireEvent.blur(input);
    expect(onSearch).toHaveBeenCalledWith("world");
  });

  it("applies an accessible label", () => {
    render(<SearchBar suggestions={[]} label="Search products" />);
    const input = screen.getByRole("searchbox", { name: "Search products" });
    expect(input).toHaveAttribute("aria-label", "Search products");
  });

  it("renders suggestions with appropriate ARIA roles", async () => {
    render(
      <SearchBar suggestions={["apple", "banana"]} label="Search" />
    );
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "a");
    const list = screen.getByRole("listbox");
    const options = screen.getAllByRole("option");
    expect(list).toBeInTheDocument();
    expect(options).toHaveLength(2);
  });

  it("supports keyboard navigation and selection", async () => {
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

    let options = screen.getAllByRole("option");
    await userEvent.keyboard("{ArrowDown}");
    options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowDown}");
    options = screen.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowUp}");
    options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("apple");
    expect(input).toHaveValue("apple");
  });
});
