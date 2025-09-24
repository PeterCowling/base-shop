import React from "react";
import { render, screen } from "@testing-library/react";
import { ColorSwatch } from "../src/components/atoms/ColorSwatch";

describe("ColorSwatch defaults", () => {
  it("renders with default size 24 and not selected", () => {
    render(<ColorSwatch color="#000" aria-label="sw" />);
    const btn = screen.getByRole("button", { name: "sw" }) as HTMLButtonElement;
    expect(btn.style.width).toBe("24px");
    expect(btn.style.height).toBe("24px");
    expect(btn.className).not.toMatch(/ring-2/);
  });
});

