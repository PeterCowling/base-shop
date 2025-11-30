import { render, screen } from "@testing-library/react";
import React from "react";
import StepPage from "./step-page";

jest.mock("../ConfiguratorContext", () => ({
  useConfigurator: () => ({ state: { completed: {} } }),
}));

jest.mock("../steps", () => {
  const stepsMap = {
    current: {
      id: "current",
      component: ({ prevStepId, nextStepId }: any) => (
        <div data-cy="step" data-prev={prevStepId} data-next={nextStepId} />
      ),
    },
  };

  return {
    ConfiguratorProgress: ({ currentStepId }: any) => (
      <div data-cy="progress">{currentStepId}</div>
    ),
    getSteps: () => [
      { id: "prev" },
      { id: "current" },
      { id: "next" },
    ],
    getStepsMap: () => stepsMap,
    stepIndex: { current: 1 },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

it("returns null for unknown step", () => {
  const { container } = render(<StepPage stepId="missing" />);
  expect(container.firstChild).toBeNull();
});

it("renders progress and step component", () => {
  render(<StepPage stepId="current" />);
  expect(screen.getByTestId("progress")).toHaveTextContent("current");
  const step = screen.getByTestId("step");
  expect(step.getAttribute("data-prev")).toBe("prev");
  expect(step.getAttribute("data-next")).toBe("next");
});
