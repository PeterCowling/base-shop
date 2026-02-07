import React from "react";
import { render, screen } from "@testing-library/react";

import { Progress } from "../src/components/atoms/Progress";

describe("Progress", () => {
  it("renders bar width according to value and optional label", () => {
    const { rerender, container } = render(
      <Progress value={25} label="25%" />
    );
    const bar = container.querySelector("[data-token='--color-primary']") as HTMLElement;
    expect(bar.style.transform).toBe("scaleX(0.25)");
    expect(screen.getByText("25%"));

    rerender(<Progress value={60} />);
    const bar2 = container.querySelector("[data-token='--color-primary']") as HTMLElement;
    expect(bar2.style.transform).toBe("scaleX(0.6)");
    expect(screen.queryByText(/%/)).toBeNull();
  });
});
