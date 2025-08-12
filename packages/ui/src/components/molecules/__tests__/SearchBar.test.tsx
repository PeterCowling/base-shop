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

  it("navigates suggestions with keyboard and selects with Enter", async () => {
    const onSelect = jest.fn();
    render(
      <SearchBar
        suggestions={["Alpha", "Beta", "Gamma"]}
        onSelect={onSelect}
      />
    );
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "a");

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(3);

    await userEvent.keyboard("{ArrowDown}");
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowDown}");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowUp}");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");

    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("Alpha");
    expect(input).toHaveValue("Alpha");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders suggestions with ARIA roles", async () => {
    render(<SearchBar suggestions={["One", "Two"]} />);
    const input = screen.getByRole("searchbox");
    await userEvent.type(input, "o");
    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(2);
  });
});
