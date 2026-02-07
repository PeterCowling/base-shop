import { render, screen } from "@testing-library/react";

import useReducedMotion from "../../hooks/useReducedMotion";
import MilestoneToast from "../MilestoneToast";
import StepFlowShell from "../StepFlowShell";
import StepProgress from "../StepProgress";
import TrustCue from "../TrustCue";

jest.mock("../../hooks/useReducedMotion", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("Step flow primitives", () => {
  const mockedUseReducedMotion = useReducedMotion as jest.MockedFunction<
    typeof useReducedMotion
  >;

  beforeEach(() => {
    mockedUseReducedMotion.mockReturnValue(false);
  });

  it("TC-01: render semantics expose progressbar + trust note", () => {
    render(
      <StepFlowShell
        currentStep={2}
        totalSteps={3}
        title="Arrival onboarding"
        description="Complete the quick steps below."
        trustCue={{
          title: "Privacy reassurance",
          description: "Only used for your current stay.",
        }}
      >
        <button type="button">Continue</button>
      </StepFlowShell>,
    );

    expect(
      screen.getByRole("progressbar", { name: "Step progress" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: "Privacy reassurance" }),
    ).toBeInTheDocument();
  });

  it("TC-02: reduced motion disables pulse animation while keeping confirmation message", () => {
    mockedUseReducedMotion.mockReturnValue(true);
    render(<MilestoneToast message="Great progress" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Great progress");
    expect(status).not.toHaveClass("animate-pulse");
  });

  it("TC-03: primitive pieces render standalone for composition", () => {
    render(
      <div>
        <StepProgress currentStep={1} totalSteps={3} label="Wizard progress" />
        <TrustCue title="Why this helps" description="Reception can prepare ahead." />
      </div>,
    );

    expect(
      screen.getByRole("progressbar", { name: "Wizard progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "Why this helps" })).toBeInTheDocument();
  });
});
