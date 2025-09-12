import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { RatingSummary } from "./RatingSummary";

describe("RatingSummary", () => {
  it("renders rounded rating and correct number of filled stars", () => {
    const { container } = render(<RatingSummary rating={3.26} count={5} />);
    // rating is rounded to one decimal place
    expect(screen.getByText("3.3")).toBeInTheDocument();

    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    const filledStars = container.querySelectorAll("svg.fill-yellow-500");
    expect(filledStars).toHaveLength(3);
  });
});
