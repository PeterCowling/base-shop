import { render } from "@testing-library/react";

import CmsReviewsCarousel from "../ReviewsCarousel";

jest.mock("../../../home/ReviewsCarousel", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="reviews-carousel" />),
}));

const mockReviewsCarousel = jest.requireMock("../../../home/ReviewsCarousel")
  .default as jest.Mock;

describe("CmsReviewsCarousel", () => {
  beforeEach(() => {
    mockReviewsCarousel.mockClear();
  });

  const reviews = [
    { nameKey: "n1", quoteKey: "q1" },
    { nameKey: "n2", quoteKey: "q2" },
    { nameKey: "n3", quoteKey: "q3" },
  ];

  it("renders with sufficient reviews and maxItems truncation", () => {
    render(
      <CmsReviewsCarousel reviews={reviews} minItems={2} maxItems={2} />
    );
    expect(mockReviewsCarousel).toHaveBeenCalledTimes(1);
    expect(mockReviewsCarousel.mock.calls[0][0].reviews).toEqual(
      reviews.slice(0, 2)
    );
  });

  it("renders when minItems is undefined", () => {
    render(<CmsReviewsCarousel reviews={reviews} />);
    expect(mockReviewsCarousel).toHaveBeenCalledTimes(1);
    expect(mockReviewsCarousel.mock.calls[0][0]).toEqual({ reviews });
  });

  it("returns null when reviews is empty", () => {
    const { container } = render(<CmsReviewsCarousel reviews={[]} />);
    expect(container.firstChild).toBeNull();
    expect(mockReviewsCarousel).not.toHaveBeenCalled();
  });

  it("returns null when list.length < minItems", () => {
    const { container } = render(
      <CmsReviewsCarousel reviews={reviews.slice(0, 1)} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
    expect(mockReviewsCarousel).not.toHaveBeenCalled();
  });
});

