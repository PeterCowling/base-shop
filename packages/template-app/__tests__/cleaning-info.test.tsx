/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import CleaningInfo from "../src/components/CleaningInfo";

describe("CleaningInfo", () => {
  it("renders cleaning text", () => {
    render(<CleaningInfo />);
    expect(
      screen.getByText(/eco-friendly wash/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/machine-washed and fully sanitized/i),
    ).toBeInTheDocument();
  });
});

