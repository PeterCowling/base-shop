import { fireEvent, render, screen } from "@testing-library/react";
import ImageGallery from "../components/pdp/ImageGallery";

describe("ImageGallery", () => {
  it("toggles zoom on click", () => {
    render(<ImageGallery src="/img.jpg" alt="img" />);
    const img = screen.getByAltText("img");
    const figure = img.closest("figure")!;
    expect(img.className).not.toContain("scale-125");
    fireEvent.click(figure);
    expect(img.className).toContain("scale-125");
    fireEvent.click(figure);
    expect(img.className).not.toContain("scale-125");
  });
});
