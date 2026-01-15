import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../Days", () => ({
  __esModule: true,
  SingleFree: () => <div>FREE</div>,
  SingleDisabled: () => <div>DISABLED</div>,
  SingleStart: () => <div>START</div>,
  SingleFull: () => <div>FULL</div>,
  SingleEnd: () => <div>END</div>,
  Intersection: () => <div>INTERSECTION</div>,
}));

import { Day } from "../Day";
import type { TDayType } from "../../../interfaces/grid.interface";

describe("Day", () => {
  it("renders specific component based on type", () => {
    render(<Day type="single.disabled" topColor="#000" />);
    expect(screen.getByText("DISABLED")).toBeInTheDocument();
  });

  it("renders start cell", () => {
    render(<Day type="single.start" topColor="#000" />);
    expect(screen.getByText("START")).toBeInTheDocument();
  });

  it("falls back to free for unknown type", () => {
    render(<Day type={"unknown" as unknown as TDayType} topColor="#000" />);
    expect(screen.getByText("FREE")).toBeInTheDocument();
  });
});
