/* apps/cms/__tests__/dashboardSkip.integration.test.tsx */
/* eslint-env jest */

import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock(
  "@/components/atoms",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Toast: () => null,
      Tooltip: ({ children }: { children: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
    };
  },
  { virtual: true }
);

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) =>
        React.createElement("button", props, children),
    };
  },
  { virtual: true }
);

jest.mock("../src/app/cms/configurator/steps", () => {
  const steps = [
    {
      id: "opt",
      label: "Optional Step",
      component: () => null,
      optional: true,
      order: 1,
    },
  ];
  return {
    __esModule: true,
    getSteps: () => steps,
    getRequiredSteps: () => steps.filter((s) => !s.optional),
    steps: Object.fromEntries(steps.map((s) => [s.id, s])),
  };
});

import ConfiguratorDashboard from "../src/app/cms/configurator/Dashboard";
import { getRequiredSteps, getSteps } from "../src/app/cms/configurator/steps";
import { STORAGE_KEY } from "../src/app/cms/wizard/hooks/useWizardPersistence";

declare global {
  // eslint-disable-next-line no-var,vars-on-top
  var fetch: jest.Mock;
}

let serverState: { state: any; completed: Record<string, string> };
let originalAddEventListener: any;

beforeEach(() => {
  originalAddEventListener = window.addEventListener;
  window.addEventListener = jest.fn();
  const required = getRequiredSteps();
  serverState = {
    state: { shopId: "shop" },
    completed: Object.fromEntries(required.map((s) => [s.id, "complete"])),
  };
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    if (url === "/cms/api/wizard-progress") {
      if (init?.method === "PUT") {
        const body = JSON.parse(init.body as string);
        serverState.state = { ...serverState.state, ...(body.data ?? {}) };
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (init?.method === "PATCH") {
        const body = JSON.parse(init.body as string);
        serverState.completed[body.stepId] = body.completed;
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => serverState });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }) as unknown as jest.Mock;
  Element.prototype.scrollIntoView = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  global.fetch.mockRestore();
  localStorage.clear();
  window.addEventListener = originalAddEventListener;
});

test("skipped optional steps do not block Launch Shop", async () => {
  render(<ConfiguratorDashboard />);
  const launchBtn = await screen.findByRole("button", { name: /launch shop/i });
  expect(launchBtn).toBeEnabled();

  const optional = getSteps().find((s) => s.optional)!;
  let stepLabel = await screen.findByText(optional.label);
  fireEvent.click(
    within(stepLabel.closest("li")!).getByRole("button", { name: /skip/i })
  );

  stepLabel = await screen.findByText(optional.label);
  const resetBtn = within(stepLabel.closest("li")!).getByRole("button", { name: /reset/i });
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  expect(stored.completed?.[optional.id]).toBe("skipped");
  expect(launchBtn).toBeEnabled();

  fireEvent.click(resetBtn);
  await screen.findByRole("button", { name: /skip/i });
  const stored2 = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  expect(stored2.completed?.[optional.id]).toBe("pending");
  expect(launchBtn).toBeEnabled();
});
