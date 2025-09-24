import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { ColorSwatch } from "../src/components/atoms/ColorSwatch";

describe("ColorSwatch", () => {
  it("applies size, color and selected ring class", () => {
    const { rerender, getByRole } = render(
      <ColorSwatch color="#ff0000" size={30} selected={false} aria-label="swatch" />
    );
    const btn = getByRole("button", { name: "swatch" }) as HTMLButtonElement;
    // jsdom normalizes to rgb()
    expect(btn.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(btn.style.width).toBe("30px");
    expect(btn.style.height).toBe("30px");
    expect(btn.className).not.toMatch(/ring-2/);

    rerender(
      <ColorSwatch color="#00ff00" size={16} selected aria-label="swatch" />
    );
    const btn2 = getByRole("button", { name: "swatch" }) as HTMLButtonElement;
    expect(btn2.className).toMatch(/ring-2/);
  });

  it("fires onClick when pressed", () => {
    const onClick = jest.fn();
    const { getByRole } = render(
      <ColorSwatch color="#123456" aria-label="pick" onClick={onClick} />
    );
    fireEvent.click(getByRole("button", { name: "pick" }));
    expect(onClick).toHaveBeenCalled();
  });
});
