import { render, screen } from "@testing-library/react";

jest.mock("@acme/ui/components/home/HeroBanner.client", () => ({
  __esModule: true,
  // Use data-cy so getByTestId matches the configured attribute.
  default: () => <div data-cy="home-hero">Hero Banner</div>,
}));

jest.mock("@acme/ui/components/home/ValueProps", () => ({
  __esModule: true,
  ValueProps: () => <div data-cy="home-value-props">Value Props</div>,
}));

jest.mock("@acme/ui/components/home/ReviewsCarousel", () => ({
  __esModule: true,
  default: () => <div data-cy="home-reviews">Reviews Carousel</div>,
}));

import Home from "../page.client";

describe("Home page client", () => {
  it("renders mocked sections once in order", () => {
    const { container } = render(<Home />);

    expect(screen.getAllByTestId("home-hero")).toHaveLength(1);
    expect(screen.getAllByTestId("home-value-props")).toHaveLength(1);
    expect(screen.getAllByTestId("home-reviews")).toHaveLength(1);

    const sectionOrder = Array.from(
      container.querySelectorAll('[data-cy^="home-"]'),
    ).map((element) => element.getAttribute("data-cy") ?? "");

    expect(sectionOrder).toEqual([
      "home-hero",
      "home-value-props",
      "home-reviews",
    ]);
  });
});
