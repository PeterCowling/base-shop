import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const trackMock = jest.fn();
jest.mock("@acme/telemetry", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

jest.mock("../ConfiguratorContext", () => ({
  useConfigurator: () => ({
    state: { shopId: "demo", completed: {} },
  }),
}));

jest.mock("../steps", () => {
  const React = require("react");
  const Dummy = () => <div>Step</div>;
  return {
    ConfiguratorProgress: ({ currentStepId }: { currentStepId: string }) => (
      <div data-testid="progress">{currentStepId}</div>
    ),
    getSteps: () => [
      {
        id: "dummy",
        label: "Dummy",
        description: "desc",
        icon: "🧩",
        component: Dummy,
      },
    ],
    getStepsMap: () => ({
      dummy: {
        id: "dummy",
        label: "Dummy",
        description: "desc",
        icon: "🧩",
        component: Dummy,
      },
    }),
    stepIndex: { dummy: 0 },
  };
});

import StepPage from "../[stepId]/step-page";
import { LaunchPanel } from "../components/LaunchPanel";

describe("timer telemetry", () => {
  beforeEach(() => {
    localStorage.clear();
    trackMock.mockClear();
  });

  it("emits build_flow_timer_start once when no timer is set", () => {
    render(<StepPage stepId="dummy" />);
    expect(localStorage.getItem("cms-launch-start-demo")).toBeTruthy();
    expect(trackMock).toHaveBeenCalledWith("build_flow_timer_start", {
      shopId: "demo",
      startedAt: expect.any(Number),
    });
  });

  it("does not re-emit timer start when already tracked", () => {
    const now = Date.now();
    localStorage.setItem("cms-launch-start-demo", String(now));
    localStorage.setItem("cms-launch-start-tracked-demo", "1");
    render(<StepPage stepId="dummy" />);
    expect(trackMock).not.toHaveBeenCalledWith("build_flow_timer_start", expect.anything());
  });
});

describe("LaunchPanel confetti", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("shows celebration badge and confetti when beatTarget is true", () => {
    jest.useFakeTimers();
    render(
      <LaunchPanel
        allRequiredDone
        serverReady
        serverBlockingLabels={[]}
        beatTarget
        tooltipText="ready"
        onLaunch={jest.fn()}
        launchStatus={null}
        launchError={null}
        failedStepLink={null}
        launchChecklist={[]}
        launchEnvSummary={[]}
        launchEnv="stage"
        onChangeLaunchEnv={jest.fn()}
        shopId="demo"
      />,
    );

    expect(screen.getByText("cms.configurator.launchPanel.beatBadge")).toBeInTheDocument();
    expect(screen.getAllByText(/🎉/).length).toBeGreaterThan(0);

    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it("disables Prod toggle when stage gate is blocked", () => {
    const onChangeEnv = jest.fn();
    render(
      <LaunchPanel
        allRequiredDone
        serverReady
        serverBlockingLabels={[]}
        beatTarget={false}
        tooltipText="blocked"
        onLaunch={jest.fn()}
        launchStatus={null}
        launchError={null}
        failedStepLink={null}
        launchChecklist={[]}
        launchEnvSummary={[]}
        launchEnv="stage"
        onChangeLaunchEnv={onChangeEnv}
        shopId="demo"
        prodGateAllowed={false}
        prodGateReasons={["stage-tests", "qa-ack"]}
      />,
    );

    expect(
      screen.getByText("cms.configurator.launchPanel.stageGate.title"),
    ).toBeInTheDocument();
    const prodButton = screen.getByRole("button", { name: "prod" });
    expect(prodButton).toBeDisabled();
    fireEvent.click(prodButton);
    expect(onChangeEnv).not.toHaveBeenCalled();
  });

  it("records QA acknowledgement with optional note", () => {
    const onQaAcknowledge = jest.fn();
    render(
      <LaunchPanel
        allRequiredDone
        serverReady
        serverBlockingLabels={[]}
        beatTarget={false}
        tooltipText="ready"
        onLaunch={jest.fn()}
        launchStatus={null}
        launchError={null}
        failedStepLink={null}
        launchChecklist={[]}
        launchEnvSummary={[]}
        launchEnv="stage"
        onChangeLaunchEnv={jest.fn()}
        shopId="demo"
        qaAckRequired
        prodGateAllowed={false}
        prodGateReasons={["qa-ack"]}
        stageSmokeStatus="passed"
        onQaAcknowledge={onQaAcknowledge}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("cms.configurator.launchPanel.qa.noteLabel"),
      {
        target: { value: "Reviewed checkout flow" },
      },
    );
    fireEvent.click(screen.getByText("cms.configurator.launchPanel.qa.cta"));
    expect(onQaAcknowledge).toHaveBeenCalledWith("Reviewed checkout flow");
  });
});
