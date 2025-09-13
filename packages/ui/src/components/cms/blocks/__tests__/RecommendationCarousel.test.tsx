import { render } from "@testing-library/react";
import CmsRecommendationCarousel, { getRuntimeProps } from "../RecommendationCarousel";

jest.mock("../../../organisms/RecommendationCarousel", () => {
  const React = require("react");
  return {
    __esModule: true,
    RecommendationCarousel: jest.fn(() => <div data-testid="carousel" />),
  };
});

jest.mock("@acme/platform-core/products", () => ({
  PRODUCTS: [{ id: "1" }, { id: "2" }],
}));

const { RecommendationCarousel: MockCarousel } = require("../../../organisms/RecommendationCarousel") as {
  RecommendationCarousel: jest.Mock;
};

describe("CmsRecommendationCarousel", () => {
  afterEach(() => {
    MockCarousel.mockClear();
  });

  it("passes minItems and maxItems through", () => {
    render(<CmsRecommendationCarousel minItems={2} maxItems={5} />);
    expect(MockCarousel).toHaveBeenCalledTimes(1);
    expect(MockCarousel.mock.calls[0][0]).toEqual(
      expect.objectContaining({ minItems: 2, maxItems: 5 })
    );
  });

  it("getRuntimeProps returns endpoint and products", () => {
    expect(getRuntimeProps()).toEqual({
      endpoint: "/api",
      products: [{ id: "1" }, { id: "2" }],
    });
  });
});

