import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import Stock from "../Stock";

const useProductsMock = jest.fn();
jest.mock("../../../hooks/data/bar/useProducts", () => ({
  useProducts: useProductsMock,
}));

describe("Stock", () => {
  beforeEach(() => {
    useProductsMock.mockReturnValue({
      getProductsByCategory: (id: number) => {
        if (id === 1) return [["Beer"], ["Wine"]];
        if (id === 2) return [["Beer"], ["Soda"]];
        return [];
      },
    });
  });

  it("lists unique product names", () => {
    render(<Stock />);
    expect(screen.getByText("Beer")).toBeInTheDocument();
    expect(screen.getByText("Soda")).toBeInTheDocument();
    expect(screen.getByText("Wine")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows
    expect(screen.getAllByRole("spinbutton")).toHaveLength(12);
  });

  it("handles empty results", () => {
    useProductsMock.mockReturnValueOnce({ getProductsByCategory: () => [] });
    render(<Stock />);
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });
});
