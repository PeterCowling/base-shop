import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useWizard } from "../src/app/cms/wizard/WizardContext";
import "../../../test/resetNextMocks";
import type React from "react";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("../src/app/cms/wizard/WizardContext", () => ({
  useWizard: jest.fn(),
}));

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) => (
        <button {...props}>{children}</button>
      ),
    };
  },
  { virtual: true }
);

jest.mock(
  "@/components/atoms",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
      Tooltip: ({ children }: any) => <>{children}</>,
    };
  },
  { virtual: true }
);

jest.mock("../src/app/cms/configurator/steps", () => {
  const steps = [
    { id: "navigation", label: "Navigation", component: () => null, order: 1 },
    {
      id: "layout",
      label: "Layout",
      component: () => null,
      prerequisites: ["navigation"],
      order: 2,
    },
  ];
  return {
    getSteps: () => steps,
    getRequiredSteps: () => steps,
    steps: steps.reduce((acc: any, s) => ({ ...acc, [s.id]: s }), {}),
  };
});

const StepPage = require("../src/app/cms/configurator/[stepId]/step-page").default as React.ComponentType<any>;
const ConfiguratorDashboard = require("../src/app/cms/configurator/Dashboard").default as React.ComponentType<any>;

describe("Configurator prerequisites", () => {
  beforeEach(() => {
    (useWizard as jest.Mock).mockReturnValue({ state: { completed: {} } });
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: {}, completed: {} }),
    });
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("redirects to prerequisite step when unmet", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    render(<StepPage stepId="layout" />);
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/cms/configurator/navigation")
    );
    await screen.findByText(/please complete prerequisite steps first/i);
  });

  it("shows toast from dashboard when prerequisites missing", async () => {
    render(<ConfiguratorDashboard />);
    const layoutLink = await screen.findByText("Layout");
    fireEvent.click(layoutLink);
    await screen.findByText(/complete prerequisite steps: Navigation/i);
  });
});
