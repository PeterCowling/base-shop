import "../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
import { RatingStars } from "../RatingStars";

describe("RatingStars", () => {
  it.each([
    { rating: 3.2, filled: 3 },
    { rating: 4.8, filled: 5 },
    { rating: 0, filled: 0 },
  ])("renders correct stars for rating %p", ({ rating, filled }) => {
    const size = 24;
    const { container } = render(
      <RatingStars rating={rating} size={size} />,
    );
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    stars.forEach((star, index) => {
      expect(star).toHaveAttribute("width", size.toString());
      expect(star).toHaveAttribute("height", size.toString());
      if (index < filled) {
        expect(star).toHaveClass("fill-yellow-500");
      } else {
        expect(star).toHaveClass("fill-muted");
      }
    });
  });
});
