import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import ImageGallery from "../src/components/pdp/ImageGallery";

describe("ImageGallery", () => {
  it("returns null when items array is empty", () => {
    const { container } = render(<ImageGallery items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an image and toggles zoom on click", () => {
    const items = [{ url: "/img.jpg", type: "image" as const, altText: "img" }];
    render(<ImageGallery items={items} />);
    const img = screen.getByAltText("img");
    const figure = img.closest("figure")!;
    expect(img.className).not.toContain("scale-125");
    fireEvent.click(figure);
    expect(img.className).toContain("scale-125");
    fireEvent.click(figure);
    expect(img.className).not.toContain("scale-125");
  });

  it("renders video when thumbnail is clicked", () => {
    const items = [
      { url: "/img.jpg", type: "image" as const, altText: "img" },
      { url: "/vid.mp4", type: "video" as const },
    ];
    const { container } = render(<ImageGallery items={items} />);
    expect(container.querySelector("video")).toBeNull();
    const videoThumb = screen.getByText("Video").closest("button")!;
    fireEvent.click(videoThumb);
    expect(container.querySelector("video")).toBeInTheDocument();
  });
});
