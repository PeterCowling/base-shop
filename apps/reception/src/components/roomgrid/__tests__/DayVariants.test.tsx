import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it } from "vitest";

import { Day } from "../components/Day";
import type { TDayType } from "../interfaces/grid.interface";

describe("Day component variant mapping", () => {
  const cases: [TDayType, string][] = [
    ["single.free", "single.free"],
    ["single.disabled", "single.disabled"],
    ["single.full", "single.full"],
    ["single.start", "single.start"],
    ["single.end", "single.end"],
    ["intersection", "intersection"],
  ];

  it.each(cases)("renders %s variant", (type, testId) => {
    render(<Day type={type} topColor="#111" bottomColor="#222" />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
