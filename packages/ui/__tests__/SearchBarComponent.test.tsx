import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../src/components/molecules/SearchBar";

describe("SearchBar component", () => {
  it("navigates suggestions and selects with keyboard", async () => {
    const onSelect = jest.fn();
    const onSearch = jest.fn();
    render(
      <SearchBar
        suggestions={["apple", "banana", "cherry"]}
        onSelect={onSelect}
        onSearch={onSearch}
        label="Search"
      />
    );
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "a");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("apple");
    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveValue("apple");
  });

  it("calls onSearch when Enter is pressed without selection", async () => {
    const onSelect = jest.fn();
    const onSearch = jest.fn();
    render(
      <SearchBar
        suggestions={["apple", "banana"]}
        onSelect={onSelect}
        onSearch={onSearch}
        label="Search"
      />
    );
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "ap");
    await userEvent.keyboard("{Enter}");
    expect(onSearch).toHaveBeenCalledWith("ap");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("triggers onSearch on blur when not selecting", async () => {
    const onSearch = jest.fn();
    render(<SearchBar suggestions={[]} onSearch={onSearch} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "hello");
    fireEvent.blur(input);
    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("clears matches when query is empty", async () => {
    render(<SearchBar suggestions={["apple", "banana"]} label="Search" />);
    const input = screen.getByRole("searchbox", { name: "Search" });
    await userEvent.type(input, "a");
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    await userEvent.clear(input);
    await waitFor(() => {
      expect(screen.queryByRole("option")).toBeNull();
    });
  });
});
