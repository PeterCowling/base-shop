import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import useReducedMotion from "../../hooks/useReducedMotion";
import MilestoneToast from "../MilestoneToast";
import StepFlowShell from "../StepFlowShell";
import StepProgress from "../StepProgress";
import TrustCue from "../TrustCue";

import { LONG_SENTENCE_WITH_TOKEN, LONG_UNBROKEN_TOKEN, LONG_URL } from "./fixtures/longContent";

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

  it("TC-01: render semantics expose progressbar + trust note", async () => {
    const { container } = render(
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

  it("TC-04: shape/radius overrides propagate to shell primitives", () => {
    const { container } = render(
      <StepFlowShell
        currentStep={1}
        totalSteps={3}
        title="Arrival onboarding"
        description="Complete the quick steps below."
        onBack={() => {}}
        trustCue={{
          title: "Privacy reassurance",
          description: "Only used for your current stay.",
        }}
        milestoneMessage="Almost there"
        backButtonShape="square"
        progressSegmentShape="square"
        trustCueRadius="2xl"
        milestoneRadius="sm"
      >
        <button type="button">Continue</button>
      </StepFlowShell>,
    );

    expect(screen.getByRole("button", { name: "Go back" })).toHaveClass("rounded-none");

    const progressbar = screen.getByRole("progressbar", { name: "Step progress" });
    const firstSegment = progressbar.querySelector("div");
    expect(firstSegment).toHaveClass("rounded-none");

    expect(
      screen.getByRole("note", { name: "Privacy reassurance" }),
    ).toHaveClass("rounded-2xl");
    expect(screen.getByRole("note", { name: "Privacy reassurance" })).toHaveClass("overflow-hidden");
    expect(screen.getByRole("status")).toHaveClass("rounded-sm", "overflow-hidden");
    expect(screen.getByText("Almost there")).toHaveClass("min-w-0", "break-words");
  });

  it("TC-05: long title and message content stays present with bleed-guard classes", () => {
    render(
      <StepFlowShell
        currentStep={2}
        totalSteps={4}
        title={LONG_UNBROKEN_TOKEN}
        description={LONG_URL}
        trustCue={{
          title: LONG_UNBROKEN_TOKEN,
          description: LONG_SENTENCE_WITH_TOKEN,
        }}
        milestoneMessage={LONG_SENTENCE_WITH_TOKEN}
      >
        <button type="button">Continue</button>
      </StepFlowShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: LONG_UNBROKEN_TOKEN })).toHaveClass(
      "min-w-0",
      "break-words",
    );
    expect(screen.getByText(LONG_URL)).toHaveClass("min-w-0", "break-words");
    expect(screen.getByRole("note", { name: LONG_UNBROKEN_TOKEN })).toHaveClass("overflow-hidden");
    expect(screen.getByRole("status")).toHaveTextContent(LONG_SENTENCE_WITH_TOKEN);
  });
});
