import React from "react";
import { render } from "@testing-library/react";
import { RatingStars } from "../src/components/atoms/RatingStars";

describe("RatingStars", () => {
  it("rounds rating and fills correct number of stars with size", () => {
    const { container } = render(<RatingStars rating={3.4} size={20} />);
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    const filled = container.querySelectorAll(".fill-yellow-500");
    expect(filled).toHaveLength(3);
    expect(stars[0].getAttribute("width")).toBe("20");
    expect(stars[0].getAttribute("height")).toBe("20");
  });
});

