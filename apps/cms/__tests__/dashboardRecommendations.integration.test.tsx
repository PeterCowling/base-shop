/* apps/cms/__tests__/dashboardRecommendations.integration.test.tsx */
/* eslint-env jest */

import { fireEvent, render, screen } from "@testing-library/react";
import ConfiguratorDashboard from "../src/app/cms/configurator/Dashboard";
import { STORAGE_KEY } from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";

jest.mock("@acme/platform-core/contexts/LayoutContext", () => ({
  __esModule: true,
  useLayout: () => ({ setConfiguratorProgress: jest.fn() }),
}));

jest.mock(
  "@/components/atoms",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Progress: () => null,
      Tag: () => null,
      Toast: ({ open, message }: { open: boolean; message: string }) =>
        open ? React.createElement("div", { role: "alert" }, message) : null,
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
      Card: ({ children, asChild: _asChild, ...props }: any) =>
        React.createElement("div", props, children),
      CardContent: ({ children, asChild: _asChild, ...props }: any) =>
        React.createElement("div", props, children),
      Button: ({ children, asChild: _asChild, ...props }: any) =>
        React.createElement("button", props, children),
    };
  },
  { virtual: true }
);

jest.mock("../src/app/cms/configurator/steps", () => {
  const stepTrackMeta = {
    foundation: {
      label: "Foundation",
      description: "",
      pillClass: "",
      accentClass: "",
    },
  } as const;
  const steps = [
    {
      id: "a",
      label: "Step A",
      component: () => null,
      track: "foundation",
    },
    {
      id: "b",
      label: "Step B",
      component: () => null,
      recommended: ["a"],
      track: "foundation",
    },
  ];
  const stepsMap = Object.fromEntries(steps.map((s) => [s.id, s]));
  return {
    __esModule: true,
    getSteps: () => steps,
    getRequiredSteps: () => steps,
    getStepTrackMeta: () => stepTrackMeta,
    getStepsMap: () => stepsMap,
    steps: stepsMap,
    stepTrackMeta,
  };
});

declare global {
  var fetch: jest.Mock;
}

let serverState: { state: any; completed: Record<string, boolean> };
let originalAddEventListener: any;

beforeEach(() => {
  originalAddEventListener = window.addEventListener;
  window.addEventListener = jest.fn();
  serverState = {
    state: { shopId: "shop" },
    completed: {},
  };
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    if (url === "/cms/api/configurator-progress") {
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

test(
  "shows recommendation message when launching step with suggested steps",
  async () => {
    render(<ConfiguratorDashboard />);
    const link = (await screen.findAllByRole("link", { name: /continue step/i })).find(
      (anchor) => anchor.getAttribute("href")?.includes("/b")
    );
    expect(link).toBeDefined();
    link?.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link!);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/step a/i);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored.completed?.b).toBeFalsy();
  }
);
