import { fireEvent, render, screen } from "@testing-library/react";
import ImageGallery from "../src/components/pdp/ImageGallery";

describe("ImageGallery", () => {
  it("toggles zoom on click", () => {
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
});
