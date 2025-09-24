import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(img.className).toMatch(/scale-100/);
    fireEvent.click(figure);
    expect(img.className).toMatch(/scale-125/);
    expect((img as any).style.transform).toBe("scale(1.5)");
  });
});

