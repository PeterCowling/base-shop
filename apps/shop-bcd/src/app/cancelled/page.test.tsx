import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

import Cancelled from "./page";
const useSearchParams = require("next/navigation").useSearchParams as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

test("renders cancellation message without error", () => {
  useSearchParams.mockReturnValue(new URLSearchParams(""));
  render(<Cancelled />);
  expect(
    screen.getByRole("heading", { name: "Payment cancelled" })
  ).toBeInTheDocument();
  expect(screen.queryByText("Invalid card")).not.toBeInTheDocument();
});

test("renders error message when provided", () => {
  useSearchParams.mockReturnValue(new URLSearchParams("error=Invalid%20card"));
  render(<Cancelled />);
  expect(screen.getByText("Invalid card")).toBeInTheDocument();
});
