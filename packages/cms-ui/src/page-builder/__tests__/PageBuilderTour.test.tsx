// packages/ui/src/components/cms/page-builder/__tests__/PageBuilderTour.test.tsx
import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import PageBuilderTour, { STATUS, type Step } from "../PageBuilderTour";

describe("PageBuilderTour", () => {
  test("advances steps and calls finish/skip callbacks", () => {
    // Mount targets in DOM
    const anchor = document.createElement("div");
    anchor.id = "target1";
    document.body.appendChild(anchor);
    const anchor2 = document.createElement("div");
    anchor2.id = "target2";
    document.body.appendChild(anchor2);

    const steps: Step[] = [
      { target: "#target1", content: "First" },
      { target: "#target2", content: "Second" },
    ];
    const cb = jest.fn();
    const first = render(<PageBuilderTour steps={steps} run={true} callback={cb} />);

    // Next
    fireEvent.click(screen.getByText("Next"));
    // Back
    fireEvent.click(screen.getByText("Back"));
    // Skip
    fireEvent.click(screen.getByText("Skip"));
    expect(cb).toHaveBeenCalledWith({ status: STATUS.SKIPPED });

    // Finish
    cb.mockReset();
    first.unmount();
    render(<PageBuilderTour steps={steps} run={true} callback={cb} />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Done"));
    expect(cb).toHaveBeenCalledWith({ status: STATUS.FINISHED });
  });

  test("shows missing target helper message", () => {
    const steps: Step[] = [{ target: "#nope", content: "X" }];
    render(<PageBuilderTour steps={steps} run={true} callback={() => {}} />);
    expect(screen.getByText(/Preparing this step/i)).toBeInTheDocument();
  });
});
