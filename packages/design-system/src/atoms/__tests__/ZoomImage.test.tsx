import "../../../../../../test/resetNextMocks";

import { fireEvent, render, screen } from "@testing-library/react";

import { ZoomImage } from "../ZoomImage";

describe("ZoomImage", () => {
  it("toggles zoom style and cursor on click", () => {
    render(<ZoomImage src="/img.jpg" alt="img" width={100} height={100} />);
    const img = screen.getByAltText("img");
    const figure = img.closest("figure")!;

    // Initial state
    expect(figure).toHaveClass("cursor-zoom-in");
    expect(figure).not.toHaveClass("cursor-zoom-out");
    expect(img.style.transform).toBe("scale(1)");

    // Zoom in
    fireEvent.click(figure);
    expect(figure).toHaveClass("cursor-zoom-out");
    expect(img.style.transform).toContain("scale(1.25)");

    // Zoom out
    fireEvent.click(figure);
    expect(figure).not.toHaveClass("cursor-zoom-out");
    expect(img.style.transform).toBe("scale(1)");
  });
});
