/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import Cancelled from "../src/app/cancelled/page";
import { useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const mockUse = useSearchParams as jest.Mock;

describe("Cancelled page", () => {
  it("shows error message when provided", () => {
    mockUse.mockReturnValue(new URLSearchParams("error=oops"));
    render(<Cancelled />);
    expect(screen.getByText("oops")).toBeInTheDocument();
  });

  it("renders without error", () => {
    mockUse.mockReturnValue(new URLSearchParams(""));
    render(<Cancelled />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Payment cancelled")).toBeInTheDocument();
  });
});

