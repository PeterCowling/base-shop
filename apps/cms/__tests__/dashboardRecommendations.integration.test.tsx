/* apps/cms/__tests__/dashboardRecommendations.integration.test.tsx */
/* eslint-env jest */

import { fireEvent, render, screen } from "@testing-library/react";

import ConfiguratorDashboard from "../src/app/cms/configurator/Dashboard";
import { STORAGE_KEY } from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";

jest.mock("@acme/platform-core/contexts/LayoutContext", () => ({
  __esModule: true,
  useLayout: () => ({ setConfiguratorProgress: jest.fn() }),
}));

// Capture toast.info calls so we can assert recommendation messages
// without needing a real NotificationProvider in the tree.
// NOTE: The stable _toastInfo object is created inside the factory so it is
// accessible even after jest.mock() hoisting.
jest.mock("@acme/ui/operations", () => {
  const React = require("react");
  const _toastInfo = jest.fn();
  return {
    __toastInfo: _toastInfo,
    useToast: () => ({
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: _toastInfo,
      loading: jest.fn(),
      dismiss: jest.fn(),
    }),
    useNotifications: () => ({ notifications: [], addNotification: jest.fn(), removeNotification: jest.fn(), clearAll: jest.fn() }),
    toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn(), loading: jest.fn(), dismiss: jest.fn() },
    NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
    NotificationProviderWithGlobal: ({ children }: { children: React.ReactNode }) => children,
    NotificationContainer: () => null,
  };
});

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

let serverState: { state: any; completed: Record<string, boolean> };
let originalAddEventListener: typeof window.addEventListener;
let fetchMock: jest.Mock;

beforeEach(() => {
  originalAddEventListener = window.addEventListener;
  window.addEventListener = jest.fn();
  serverState = {
    state: { shopId: "shop" },
    completed: {},
  };
  fetchMock = jest.fn((url: string, init?: RequestInit) => {
    if (url === "/cms/api/configurator-progress" || url === "/api/configurator-progress") {
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
    if (url.startsWith("/api/launch-shop/gate")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          gate: {},
          prodAllowed: false,
          missing: [],
          stage: { status: "not-run" },
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  Element.prototype.scrollIntoView = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  fetchMock.mockRestore();
  localStorage.clear();
  window.addEventListener = originalAddEventListener;
});

beforeEach(() => {
  const { __toastInfo } = jest.requireMock("@acme/ui/operations") as { __toastInfo: jest.Mock };
  __toastInfo.mockClear();
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
    // The implementation calls toast.info() with the recommendation message
    // rather than rendering a DOM alert element.
    const { __toastInfo } = jest.requireMock("@acme/ui/operations") as { __toastInfo: jest.Mock };
    expect(__toastInfo).toHaveBeenCalledWith(
      expect.stringMatching(/step a/i),
    );
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored.completed?.b).toBeFalsy();
  }
);
