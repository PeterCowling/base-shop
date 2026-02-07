import React from "react";
import { render, screen } from "@testing-library/react";

import { Avatar } from "../src/components/atoms/Avatar";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, width, height, className }: any) => (
    <img alt={alt} width={width} height={height} className={className} />
  ),
}));

describe("Avatar", () => {
  it("renders fallback when no src, using alt initial", () => {
    render(<Avatar src="" alt="Alice" size={40} />);
    const el = screen.getByText("A");
    expect(el).toHaveClass("rounded-full");
    expect((el as HTMLElement).style.width).toBe("40px");
    expect((el as HTMLElement).style.height).toBe("40px");
  });

  it("renders image with numeric width/height parsed from strings and padding/margin classes", () => {
    render(
      <Avatar src="/me.png" alt="Me" width={"48" as any} height={"64" as any} padding="p-2" margin="m-1" />
    );
    const img = screen.getByAltText("Me") as HTMLImageElement;
    expect(img.width).toBe(48);
    expect(img.height).toBe(64);
    expect(img.className).toMatch(/rounded-full/);
    expect(img.className).toMatch(/p-2/);
    expect(img.className).toMatch(/m-1/);
  });
});
