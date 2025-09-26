/// <reference types="@testing-library/jest-dom" />
import { render, fireEvent, screen } from "@testing-library/react";
import { PaginationControl } from "../PaginationControl";

describe("PaginationControl", () => {
  it("handles first page navigation and boundaries", () => {
    const onPageChange = jest.fn();
    render(<PaginationControl page={1} pageCount={10} onPageChange={onPageChange} />);

    const prev = screen.getByRole("button", { name: /prev/i });
    const next = screen.getByRole("button", { name: /next/i });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(prev);
    expect(onPageChange).not.toHaveBeenCalled();

    fireEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("handles middle page navigation", () => {
    const onPageChange = jest.fn();
    render(<PaginationControl page={5} pageCount={10} onPageChange={onPageChange} />);

    const prev = screen.getByRole("button", { name: /prev/i });
    const next = screen.getByRole("button", { name: /next/i });

    expect(prev).not.toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(prev);
    fireEvent.click(next);

    expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 6);
  });

  it("handles last page navigation and boundaries", () => {
    const onPageChange = jest.fn();
    render(<PaginationControl page={10} pageCount={10} onPageChange={onPageChange} />);

    const prev = screen.getByRole("button", { name: /prev/i });
    const next = screen.getByRole("button", { name: /next/i });

    expect(prev).not.toBeDisabled();
    expect(next).toBeDisabled();

    fireEvent.click(next);
    expect(onPageChange).not.toHaveBeenCalled();

    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenCalledWith(9);
  });

  it("invokes onPageChange when clicking specific page buttons", () => {
    const onPageChange = jest.fn();
    render(<PaginationControl page={3} pageCount={10} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(onPageChange).toHaveBeenCalledWith(5);

    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("does nothing if onPageChange is not provided", () => {
    render(<PaginationControl page={2} pageCount={3} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    // No assertions: ensuring no crash when handler is absent
  });
});
