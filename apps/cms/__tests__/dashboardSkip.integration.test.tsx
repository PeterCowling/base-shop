/* apps/cms/__tests__/dashboardSkip.integration.test.tsx */
/* eslint-env jest */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock(
  "@/components/atoms",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Progress: () => null,
      Tag: () => null,
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

jest.mock("@acme/platform-core/contexts/LayoutContext", () => ({
  __esModule: true,
  useLayout: () => ({
    isMobileNavOpen: false,
    breadcrumbs: [],
    toggleNav: jest.fn(),
    setConfiguratorProgress: jest.fn(),
  }),
}));

jest.mock("@acme/platform-core/configurator-steps", () => ({
  __esModule: true,
  REQUIRED_CONFIG_CHECK_STEPS: [],
  OPTIONAL_CONFIG_CHECK_STEPS: [],
}));

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "cms.configurator.launch": "Launch Shop",
      "cms.configurator.launchPanel.launchButton": "Launch Shop",
      "cms.configurator.launchPanel.title": "Launch",
      "cms.configurator.launchPanel.body": "Ready to launch",
      "cms.configurator.step.skipForNow": "Skip",
      "actions.reset": "Reset Step",
    };
    return translations[key] ?? key;
  },
  LOCALES: ["en"],
}));

jest.mock("@acme/i18n/locales", () => ({
  __esModule: true,
  LOCALES: ["en"],
  locales: ["en"],
}));

jest.mock("@acme/i18n/fillLocales", () => ({
  __esModule: true,
  fillLocales: (_val: unknown, def: string) => ({ en: def }),
}));

jest.mock("../src/app/cms/configurator/steps", () => {
  const stepTrackMeta = {
    growth: {
      label: "Growth",
      description: "",
      pillClass: "",
      accentClass: "",
    },
  } as const;
  const steps = [
    {
      id: "opt",
      label: "Optional Step",
      component: () => null,
      optional: true,
      order: 1,
      track: "growth",
    },
  ];
  const stepsMap = Object.fromEntries(steps.map((s) => [s.id, s]));
  return {
    __esModule: true,
    getSteps: () => steps,
    getRequiredSteps: () => steps.filter((s) => !s.optional),
    getStepTrackMeta: () => stepTrackMeta,
    getStepsMap: () => stepsMap,
    steps: stepsMap,
    stepTrackMeta,
  };
});

import ConfiguratorDashboard from "../src/app/cms/configurator/Dashboard";
import { getRequiredSteps, getSteps } from "../src/app/cms/configurator/steps";
import { STORAGE_KEY } from "../src/app/cms/configurator/hooks/useConfiguratorPersistence";

declare global {
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
    if (url === "/api/configurator-progress" || url.startsWith("/api/configurator-progress?")) {
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
  // There are two "Launch Shop" buttons - one in LaunchPanel (smaller) and one in Dashboard (larger hero button)
  // The hero button should be enabled when all required steps are complete
  const launchBtns = await screen.findAllByRole("button", { name: /launch shop/i });
  const launchBtn = launchBtns.find((btn) => btn.classList.contains("rounded-full"))!;
  expect(launchBtn).toBeEnabled();

  const optional = getSteps().find((s) => s.optional)!;
  await screen.findByText(optional.label);
  const skipBtn = await screen.findByRole("button", { name: /skip/i });
  fireEvent.click(skipBtn);

  await screen.findByText(optional.label);
  const resetBtn = await screen.findByRole("button", { name: /reset step/i });
  await waitFor(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored.completed?.[optional.id]).toBe("skipped");
  });
  expect(launchBtn).toBeEnabled();

  fireEvent.click(resetBtn);
  await screen.findByRole("button", { name: /skip/i });
  await waitFor(() => {
    const stored2 = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored2.completed?.[optional.id]).toBe("pending");
  });
  expect(launchBtn).toBeEnabled();
});
