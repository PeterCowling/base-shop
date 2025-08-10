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
});

