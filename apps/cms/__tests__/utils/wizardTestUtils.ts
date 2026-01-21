/* eslint-env jest */

import { fireEvent, screen, waitFor, within } from "@testing-library/react";

/* -------------------------------------------------------------------------- */
/*  External stubs                                                            */
/* -------------------------------------------------------------------------- */
jest.mock("@acme/platform-core/contexts/ThemeContext", () => {
  const React = require("react");
  return {
    __esModule: true,
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useLayout: () => ({}),
  };
});
jest.mock("@acme/platform-core", () => {
  const React = require("react");
  return {
    __esModule: true,
    LayoutProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useLayout: () => ({}),
  };
});
jest.mock(
  "@/components/atoms",
  () => ({
    Progress: () => null,
    Toast: () => null,
  }),
  { virtual: true }
);
jest.mock("@/components/cms/PageBuilder", () => () => null, {
  virtual: true,
});
jest.mock("@/components/atoms/shadcn", () => ({}), { virtual: true });

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
export const themes = ["base", "dark"];
export const templates = ["template-app"];
export const NEXT_LABEL = /^(next|continue|save & continue)$/i;

/** Resolve the container that represents the *currently active* step. */
export function getActiveStepContainer(): HTMLElement {
  const nextBtns = screen.getAllByRole("button", { name: NEXT_LABEL });
  const activeNext = nextBtns.find((btn) => !btn.hasAttribute("disabled"));
  if (!activeNext) {
    throw new Error("Unable to locate an enabled navigation button");
  }
  return (
    activeNext.closest("fieldset") ?? activeNext.closest("div")
  ) as HTMLElement;
}

/** Generic step-through helper: clicks "Next / Continue" until the wizard arrives at the "Summary"/"Hosting" step. */
export async function runWizard(
  actions: Record<string, (container: HTMLElement) => void> = {}
) {
  // Ensure the first step is rendered
  await screen.findByRole("heading", { name: /shop details/i });

  for (let safety = 0; safety < 25; safety += 1) {
    const container = getActiveStepContainer();
    const headingEl = within(container).getByRole("heading", { level: 2 });
    const headingText = headingEl.textContent?.trim() ?? "";

    actions[headingText]?.(container);

    if (/summary|hosting/i.test(headingText)) break;

    fireEvent.click(
      within(container).getByRole("button", { name: NEXT_LABEL })
    );

    // Wait until *another* container becomes active
    await waitFor(() => {
      if (getActiveStepContainer() === container) {
        throw new Error("step did not advance yet");
      }
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Polyfills / spies                                                         */
/* -------------------------------------------------------------------------- */
beforeEach(() => {
  jest.spyOn(global, "fetch");
  (Element.prototype as any).scrollIntoView = jest.fn();
  localStorage.clear();
});
afterEach(() => {
  (global.fetch as jest.Mock).mockRestore();
  localStorage.clear();
});
