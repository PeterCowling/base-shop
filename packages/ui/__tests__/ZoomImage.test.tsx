import { fireEvent, render, screen } from "@testing-library/react";
import { ZoomImage } from "../src/components/atoms/ZoomImage";

describe("ZoomImage", () => {
  it("toggles zoomed state on click", () => {
    render(<ZoomImage src="/img.jpg" alt="img" width={100} height={100} />);
    const img = screen.getByAltText("img");
    const figure = img.closest("figure")!;
    expect(img.className).toContain("scale-100");
    fireEvent.click(figure);
    expect(img.className).toContain("scale-125");
    fireEvent.click(figure);
    expect(img.className).toContain("scale-100");
  });
});
