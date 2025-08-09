/* apps/cms/__tests__/wizard-flow.integration.test.tsx */
/* eslint-env jest */

/** Stubs to simplify rendering Wizard in JSDOM */
jest.mock("@platform-core/src/contexts/ThemeContext", () => {
  const React = require("react");
  return {
    __esModule: true,
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useLayout: () => ({}),
  };
});

jest.mock("@platform-core/src", () => {
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
import { STORAGE_KEY } from "../src/app/cms/wizard/storageUtils";

const themes = ["base", "dark"];
const templates = ["template-app"];

async function goTo(heading: string): Promise<HTMLElement> {
  const el = await screen.findByRole("heading", { name: heading });
  return (
    (el.closest("div") as HTMLElement) ||
    (el.closest("fieldset") as HTMLElement)
  );
}

async function nextFrom(container: HTMLElement): Promise<void> {
  fireEvent.click(
    within(container).getAllByRole("button", {
      name: /next|save & continue/i,
    })[0]
  );
}

beforeEach(() => {
  (global.fetch as any) = jest.fn(() => Promise.resolve({ ok: true }));
  Element.prototype.scrollIntoView = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  (global.fetch as jest.Mock).mockReset();
  localStorage.clear();
});

/* -------------------------------------------------------------------------- */
/*  Test                                                                      */
/* -------------------------------------------------------------------------- */

describe("Wizard locale flow", () => {
  it("preserves locale fields across navigation and reload", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ step: 11, shopId: "shop" })
    );
    const { unmount } = render(
      <Wizard themes={themes} templates={templates} />
    );

    let step = await goTo("Summary");
    fireEvent.change(within(step).getByLabelText(/home page title \(en\)/i), {
      target: { value: "Hello" },
    });
    fireEvent.change(within(step).getByLabelText(/home page title \(de\)/i), {
      target: { value: "Hallo" },
    });
    await nextFrom(step);

    const importStep = await goTo("Import Data");
    fireEvent.click(within(importStep).getByRole("button", { name: /back/i }));

    const summary = await goTo("Summary");
    expect(
      within(summary).getByLabelText(/home page title \(en\)/i)
    ).toHaveValue("Hello");
    expect(
      within(summary).getByLabelText(/home page title \(de\)/i)
    ).toHaveValue("Hallo");

    fireEvent.click(within(summary).getByRole("button", { name: /next/i }));

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

    const importStep2 = await goTo("Import Data");
    fireEvent.click(within(importStep2).getByRole("button", { name: /back/i }));

    const summary2 = await goTo("Summary");
    expect(
      within(summary2).getByLabelText(/home page title \(en\)/i)
    ).toHaveValue("Hello");
    expect(
      within(summary2).getByLabelText(/home page title \(de\)/i)
    ).toHaveValue("Hallo");
  });
});
