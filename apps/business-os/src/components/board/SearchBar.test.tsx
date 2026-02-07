/**
 * SearchBar Component Tests
 * BOS-UX-05
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders search input with placeholder", () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} value="" />);

    const input = screen.getByPlaceholderText(/search cards/i);
    expect(input).toBeInTheDocument();
  });

  it("calls onChange handler with debounced value", async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} value="" />);

    const input = screen.getByPlaceholderText(/search cards/i);
    await user.type(input, "test");

    // Should not call immediately
    expect(onSearch).not.toHaveBeenCalled();

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(onSearch).toHaveBeenCalledWith("test");
      },
      { timeout: 500 }
    );
  });

  it("shows clear button when value is not empty", () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} value="test query" />);

    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it("does not show clear button when value is empty", () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} value="" />);

    const clearButton = screen.queryByRole("button", { name: /clear/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it("clears search when clear button clicked", async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} value="test query" />);

    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("clears search when Escape key pressed", async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} value="test query" />);

    const input = screen.getByPlaceholderText(/search cards/i);
    await user.click(input); // Focus input
    await user.keyboard("{Escape}");

    expect(onSearch).toHaveBeenCalledWith("");
  });
});
