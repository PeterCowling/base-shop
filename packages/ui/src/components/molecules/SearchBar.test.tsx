import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders suggestions based on input", async () => {
    render(<SearchBar label="Search" suggestions={["apple", "banana", "cherry"]} />);
    const input = screen.getByRole("searchbox", { name: "Search" });

    await userEvent.type(input, "a");

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("apple");
    expect(options[1]).toHaveTextContent("banana");
  });

  it("calls onSearch when submitting", async () => {
    const onSearch = jest.fn();
    render(<SearchBar label="Search" suggestions={[]} onSearch={onSearch} />);
    const input = screen.getByRole("searchbox", { name: "Search" });

    await userEvent.type(input, "hello");
    await userEvent.keyboard("{Enter}");

    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("selects a suggestion when clicked", async () => {
    const onSelect = jest.fn();
    render(
      <SearchBar label="Search" suggestions={["apple", "banana"]} onSelect={onSelect} />
    );
    const input = screen.getByRole("searchbox", { name: "Search" });

    await userEvent.type(input, "b");
    const option = await screen.findByRole("option", { name: "banana" });
    await userEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith("banana");
    expect(input).toHaveValue("banana");
  });
});
