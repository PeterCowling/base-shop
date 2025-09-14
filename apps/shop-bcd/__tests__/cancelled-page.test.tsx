import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

import Cancelled from "../src/app/cancelled/page";
import { useSearchParams } from "next/navigation";

const mockUseSearchParams = useSearchParams as unknown as jest.Mock;

describe("cancelled page", () => {
  it("renders without error message by default", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
    render(<Cancelled />);
    expect(screen.getByText("Payment cancelled")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("displays error message when provided", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("error=oops"));
    render(<Cancelled />);
    expect(screen.getByText("Payment cancelled")).toBeInTheDocument();
    expect(screen.getByText("oops")).toBeInTheDocument();
  });
});
