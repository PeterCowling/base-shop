/* eslint-env jest */

/** Stubs to simplify rendering Wizard in JSDOM */
jest.mock("@platform-core/contexts/ThemeContext", () => {
  const React = require("react");
  return {
    __esModule: true,
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useLayout: () => ({}),
  };
});

jest.mock("@platform-core", () => {
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

import { fireEvent, render, screen, within } from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";

const themes = ["base", "dark"];
const templates = ["template-app"];

let serverState: any = { state: {}, completed: {} };

beforeEach(() => {
  serverState = { state: {}, completed: {} };
  (global.fetch as any) = jest.fn((url: string, init?: any) => {
    if (url === "/cms/api/wizard-progress") {
      if (init && init.method === "PUT") {
        const body = JSON.parse(init.body as string);
        serverState.state = { ...serverState.state, ...(body.data || {}) };
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (init && init.method === "PATCH") {
        const body = JSON.parse(init.body as string);
        serverState.completed = {
          ...serverState.completed,
          [body.stepId]: body.completed,
        };
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => serverState });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

async function goTo(heading: string): Promise<HTMLElement> {
  const el = await screen.findByRole("heading", { name: heading });
  return (
    (el.closest("div") as HTMLElement) ||
    (el.closest("fieldset") as HTMLElement)
  );
}

describe("Wizard locale flow", () => {
  it("preserves locale fields across navigation and reload", async () => {
    serverState = { state: {}, completed: {} };

    const { unmount } = render(
      <Wizard themes={themes} templates={templates} />
    );

    const details = await goTo("Shop Details");
    fireEvent.change(within(details).getByLabelText(/Shop ID/i), {
      target: { value: "shop" },
    });
    fireEvent.click(within(details).getByRole("button", { name: /next/i }));

    const themeStep = await goTo("Select Theme");
    fireEvent.click(within(themeStep).getByRole("button", { name: /next/i }));

    const summary = await goTo("Summary");
    fireEvent.change(within(summary).getByLabelText(/home page title \(en\)/i), {
      target: { value: "Hello" },
    });
    fireEvent.change(within(summary).getByLabelText(/home page title \(de\)/i), {
      target: { value: "Hallo" },
    });

    fireEvent.click(within(summary).getByRole("button", { name: /next/i }));

    const importStep = await goTo("Import Data");
    fireEvent.click(within(importStep).getByRole("button", { name: /back/i }));

    const summary2 = await goTo("Summary");
    expect(
      within(summary2).getByLabelText(/home page title \(en\)/i)
    ).toHaveValue("Hello");
    expect(
      within(summary2).getByLabelText(/home page title \(de\)/i)
    ).toHaveValue("Hallo");

    fireEvent.click(within(summary2).getByRole("button", { name: /next/i }));

    const originalReload = window.location.reload;
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: jest.fn() },
      writable: true,
    });
    window.location.reload();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: originalReload },
    });
    unmount();

    render(<Wizard themes={themes} templates={templates} />);

    const details2 = await goTo("Shop Details");
    fireEvent.click(within(details2).getByRole("button", { name: /next/i }));

    const themeStep2 = await goTo("Select Theme");
    fireEvent.click(within(themeStep2).getByRole("button", { name: /next/i }));

    const summary3 = await goTo("Summary");
    expect(
      within(summary3).getByLabelText(/home page title \(en\)/i)
    ).toHaveValue("Hello");
    expect(
      within(summary3).getByLabelText(/home page title \(de\)/i)
    ).toHaveValue("Hallo");
  });
});

jest.mock(
  "@/components/atoms",
  () => ({
    Progress: () => null,
    Toast: () => null,
  }),
  { virtual: true }
);

jest.mock("@/components/atoms/shadcn", () => ({}), { virtual: true });

jest.mock("@/components/cms/PageBuilder", () => () => null, {
  virtual: true,
});

