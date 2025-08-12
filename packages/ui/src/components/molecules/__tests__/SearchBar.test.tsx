import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
