import React from "react";
import { render, screen } from "@testing-library/react";
import Gallery from "../../blocks/Gallery";

// Mock Next.js <Image> to a plain <img>
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, unoptimized, fill, ...rest }: any) => React.createElement("img", rest),
}));

describe("Gallery lightbox integration", () => {
  const images = [
    { src: "/a.jpg", alt: "A", caption: "Alpha" },
    { src: "/b.jpg", alt: "B" },
  ];

  it("wraps images with anchors and data attributes when openInLightbox is true", () => {
    const { container } = render(<Gallery images={images} openInLightbox />);
    const root = container.querySelector("[data-lightbox-root]");
    expect(root).toBeTruthy();
    const anchors = container.querySelectorAll<HTMLAnchorElement>("a[data-lightbox]");
    expect(anchors.length).toBe(2);
    expect(anchors[0].getAttribute("href")).toBe("/a.jpg");
    expect(anchors[1].getAttribute("href")).toBe("/b.jpg");
    // Ensure img elements are rendered with alt text
    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
  });

  it("renders plain images without anchors when openInLightbox is false", () => {
    const { container } = render(<Gallery images={images} openInLightbox={false} />);
    const anchors = container.querySelectorAll("a[data-lightbox]");
    expect(anchors.length).toBe(0);
    // There should still be two images
    expect(screen.getByAltText("A")).toBeInTheDocument();
    expect(screen.getByAltText("B")).toBeInTheDocument();
  });
});

