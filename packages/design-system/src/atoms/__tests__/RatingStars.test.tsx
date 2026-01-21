import "../../../../../../test/resetNextMocks";

import { render } from "@testing-library/react";

import { RatingStars } from "../RatingStars";

describe("RatingStars", () => {
  it("renders filled, half and empty stars based on rating", () => {
    const size = 24;
    const { container } = render(<RatingStars rating={3.7} size={size} />);
    const stars = Array.from(container.querySelectorAll("svg"));
    expect(stars).toHaveLength(5);

    const overlays = stars.map((star) => star.querySelector("g.fill-warning"));
    expect(overlays.filter(Boolean)).toHaveLength(4); // 3 full + 1 half
    expect(overlays[0]).not.toBeNull();
    expect(overlays[1]).not.toBeNull();
    expect(overlays[2]).not.toBeNull();
    expect(overlays[3]).not.toBeNull();
    expect(overlays[4]).toBeNull();

    const halfStar = overlays[3] as SVGElement;
    expect(halfStar.style.clipPath).toContain("50%");

    stars.forEach((star) => {
      expect(star).toHaveAttribute("width", size.toString());
      expect(star).toHaveAttribute("height", size.toString());
    });
  });

  it("clamps rating and exposes an accessible label", () => {
    const { container } = render(<RatingStars rating={6} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("role", "img");
    expect(wrapper).toHaveAttribute("aria-label", "5 out of 5 stars");
  });
});
