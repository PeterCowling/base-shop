import React from "react";
import { render } from "@testing-library/react";
import ImageSlider, { type ImageSlide } from "../../blocks/ImageSlider";

describe("ImageSlider lightbox integration", () => {
  const slides: ImageSlide[] = [
    { src: "/1.jpg", alt: "one", caption: "first" },
    { src: "/2.jpg", alt: "two" },
  ];

  it("adds data-lightbox attributes and anchors when enabled", () => {
    const { container } = render(<ImageSlider slides={slides} openInLightbox />);
    const root = container.querySelector("[data-lightbox-root]");
    expect(root).toBeTruthy();
    const anchors = container.querySelectorAll<HTMLAnchorElement>("a[data-lightbox]");
    // Only the active slide is visible, but anchors exist in DOM per slide
    expect(anchors.length).toBe(2);
    expect(anchors[0].getAttribute("href")).toBe("/1.jpg");
    expect(anchors[1].getAttribute("href")).toBe("/2.jpg");
  });

  it("renders without anchors when disabled", () => {
    const { container } = render(<ImageSlider slides={slides} openInLightbox={false} />);
    const anchors = container.querySelectorAll("a[data-lightbox]");
    expect(anchors.length).toBe(0);
  });
});

