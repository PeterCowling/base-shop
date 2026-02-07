import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { RatingSummary } from "../RatingSummary";

const mockRatingStars = jest.fn((props: any) => <div data-testid="rating-stars" />);

jest.mock("../../atoms/RatingStars", () => ({
  RatingStars: (props: any) => mockRatingStars(props),
}));

describe("RatingSummary", () => {
  afterEach(() => {
    mockRatingStars.mockClear();
  });

  it("displays rounded rating and review count when provided", async () => {
    const { container } = render(<RatingSummary rating={4.26} count={7} />);
    expect(screen.getByText("4.3")).toBeInTheDocument();
    expect(screen.getByText("(7)")).toBeInTheDocument();
  });

  it("omits review count when count is undefined", () => {
    render(<RatingSummary rating={4.26} />);
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it("passes rating to RatingStars", () => {
    render(<RatingSummary rating={3.7} />);
    expect(mockRatingStars).toHaveBeenCalled();

    expect(mockRatingStars.mock.calls[0][0].rating).toBe(3.7);
  });
});

