import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import { ZoomImage } from "../src/components/atoms/ZoomImage";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, className, style }: any) => (
    <img alt={alt} className={className} style={style} />
  ),
}));

describe("ZoomImage", () => {
  it("toggles zoom on click and applies transform scale", () => {
    render(<ZoomImage src="/a.jpg" alt="a" width={100} height={100} zoomScale={1.5} />);
    const figure = screen.getByRole("img").parentElement as HTMLElement;
    const img = screen.getByRole("img") as HTMLImageElement;
    // Component uses inline style transforms, not Tailwind scale classes
    expect(img.style.transform).toBe("scale(1)");
    fireEvent.click(figure);
    expect(img.style.transform).toBe("scale(1.5)");
  });

  it("supports keyboard toggles and falls back to an empty alt", () => {
    render(<ZoomImage src="/b.jpg" alt="" width={50} height={50} />);

    const figure = screen.getByRole("button");
    const img = figure.querySelector("img") as HTMLImageElement;

    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(figure).toHaveAttribute("aria-pressed", "false");

    fireEvent.keyDown(figure, { key: "Enter" });
    expect(figure).toHaveAttribute("aria-pressed", "true");
    expect(figure.className).toMatch(/cursor-zoom-out/);

    fireEvent.keyDown(figure, { key: " " });
    expect(figure).toHaveAttribute("aria-pressed", "false");
  });
});
