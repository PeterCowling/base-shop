import * as React from "react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";

import AccessSignals from "../AccessSignals.client";

afterEach(() => {
  jest.useRealTimers();
});

describe("AccessSignals", () => {
  it("renders nothing when no signals are provided", () => {
    const { container } = render(<AccessSignals />);
    expect(container.firstChild).toBeNull();
  });

  it("renders countdown and live state for drop", () => {
    jest.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const dropOpensAt = new Date("2026-01-01T01:00:00Z").toISOString();

    render(<AccessSignals dropLabel="Next drop" dropOpensAt={dropOpensAt} />);

    expect(screen.getByText(/Opens in/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000 + 1000);
    });
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("cycles key series values", () => {
    jest.useFakeTimers();
    render(
      <AccessSignals
        keySeries={["Series A", "Series B"]}
        keysRemaining="12"
      />,
    );

    expect(screen.getByText("Series A")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3200);
    });
    expect(screen.getByText("Series B")).toBeInTheDocument();
  });
});
