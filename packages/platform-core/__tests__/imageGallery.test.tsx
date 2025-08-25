import { fireEvent, render, screen } from "@testing-library/react";
import ImageGallery from "../src/components/pdp/ImageGallery";

describe("ImageGallery", () => {
  it("switches images when thumbnails are clicked", () => {
    const items = [
      { type: "image" as const, url: "/img1.jpg", altText: "img1" },
      { type: "image" as const, url: "/img2.jpg", altText: "img2" },
    ];

    render(<ImageGallery items={items} />);

    // First image is shown initially
    expect(screen.getByAltText("img1")).toBeInTheDocument();

    // Click the second thumbnail
    fireEvent.click(screen.getAllByRole("button")[1]);

    // Now the second image should be displayed
    expect(screen.getByAltText("img2")).toBeInTheDocument();
  });
});
