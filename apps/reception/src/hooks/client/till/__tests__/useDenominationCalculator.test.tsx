import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import type { Denomination } from "../../../../types/component/Till";
import { useDenominationCalculator } from "../useDenominationCalculator";

const SAMPLE_DENOMS: Denomination[] = [
  { label: "one", value: 1 },
  { label: "two", value: 2 },
  { label: "five", value: 5 },
];

describe("useDenominationCalculator", () => {
  it("updates counts and totals when values change", () => {
    const { result } = renderHook(() =>
      useDenominationCalculator(SAMPLE_DENOMS)
    );

    act(() => {
      result.current.handleDenomChange(0, "2");
      result.current.handleDenomChange(1, "3");
    });

    expect(result.current.denomCounts).toEqual([2, 3, 0]);
    expect(result.current.totalDenomValue).toBeCloseTo(2 * 1 + 3 * 2);
  });
});
