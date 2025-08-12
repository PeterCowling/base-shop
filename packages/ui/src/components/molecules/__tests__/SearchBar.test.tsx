import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  it("calls onSearch when pressing Enter", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "hello{enter}");
    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("calls onSearch when input loses focus", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "world");
    fireEvent.blur(input);
    expect(onSearch).toHaveBeenCalledWith("world");
  });

  it("is accessible and exposes suggestions with roles", async () => {
    render(<SearchBar suggestions={["Apple", "Banana"]} />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "a");
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(within(listbox).getAllByRole("option")).toHaveLength(2);
  });

  it("allows navigating suggestions with keyboard", async () => {
    const onSelect = jest.fn();
    render(
      <SearchBar suggestions={["Apple", "Banana"]} onSelect={onSelect} />
    );
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "a");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("Apple");
  });
});
