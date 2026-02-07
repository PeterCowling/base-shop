import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  it("updates suggestions as query changes", async () => {
    render(<SearchBar suggestions={["apple", "banana", "cherry"]} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });

    await userEvent.type(input, "a");
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("apple");
    expect(options[1]).toHaveTextContent("banana");

    await userEvent.type(input, "p");
    await waitFor(() => {
      const updated = screen.getAllByRole("option");
      expect(updated).toHaveLength(1);
      expect(updated[0]).toHaveTextContent("apple");
    });
  });

  it("cycles and selects suggestions with arrow keys and enter", async () => {
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

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowUp}");

    const options = screen.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("banana");
    expect(input).toHaveValue("banana");
  });

  it("updates value on change and triggers onSearch on submit", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "hello");
    expect(input).toHaveValue("hello");
    await userEvent.keyboard("{Enter}");
    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("triggers onSearch on blur", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "world");
    fireEvent.blur(input);
    expect(onSearch).toHaveBeenCalledWith("world");
  });
});
