/* apps/cms/__tests__/wizard.test.tsx */
/* eslint-env jest */
/* -------------------------------------------------------------------------- */
/*  External-module stubs                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The real ThemeContext provider in `@platform-core/src/contexts/ThemeContext`
 * calls React hooks, which blows up when we render the Wizard in a plain test
 * environment.  Replace it (and the re-exports in the barrel file) with
 * no-op fragments + dummies *before* we import the component under test.
 */
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

/* -------------------------------------------------------------------------- */
/*  Imports                                                                   */
/* -------------------------------------------------------------------------- */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";
import { STORAGE_KEY, baseTokens } from "../src/app/cms/wizard/utils";

/* -------------------------------------------------------------------------- */
/*  Test data / helpers                                                       */
/* -------------------------------------------------------------------------- */

const themes = ["base", "dark"];
const templates = ["template-app"];

/**
 * Advance through the wizard by clicking the "Next" or "Save & Continue"
 * button within each step container, identified via its heading.  Optional
 * callbacks may run at specific steps before moving on.
 */
const stepHeadings = [
  "Shop Details",
  "Select Theme",
  "Color Palette",
  "Customize Tokens",
  "Options",
  "Navigation",
  "Layout",
  "Checkout Page",
  "Shop Page",
  "Product Detail Page",
  "Additional Pages",
  "Summary",
  "Import Data",
  "Seed Data",
  "Hosting",
] as const;

type StepCallback = (container: HTMLElement) => void;

const runWizard = async (
  actions: Record<string, StepCallback> = {}
): Promise<void> => {
  for (const heading of stepHeadings) {
    const el = await screen.findByRole("heading", { name: heading });
    const container =
      (el.closest("div") as HTMLElement) ||
      (el.closest("fieldset") as HTMLElement);
    if (actions[heading]) {
      actions[heading](container);
    }
    if (heading === "Hosting") break;
    const next = within(container).getAllByRole("button", {
      name: /next|save & continue/i,
    })[0];
    fireEvent.click(next);
  }
};

beforeEach(() => {
  /* global fetch stub */
  (global.fetch as any) = jest.fn(() => Promise.resolve({ ok: true }));
  /* jsdom polyfills */
  Element.prototype.scrollIntoView = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  (global.fetch as jest.Mock).mockReset();
  localStorage.clear();
});

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("Wizard", () => {
  it("submits after navigating steps", async () => {
    render(<Wizard themes={themes} templates={templates} />);

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "testshop" },
    });

    await runWizard({
      Summary: (c) =>
        fireEvent.click(within(c).getByRole("button", { name: "Create Shop" })),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("loads tokens for a newly added theme", async () => {
    const { container } = render(
      <Wizard themes={["base", "dark"]} templates={templates} />
    );

    const details = screen.getByRole("heading", { name: "Shop Details" })
      .parentElement as HTMLElement;

    fireEvent.change(within(details).getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    fireEvent.click(within(details).getByRole("button", { name: /next/i }));

    const themeStep = screen.getByRole("heading", { name: "Select Theme" })
      .parentElement as HTMLElement;

    fireEvent.click(within(themeStep).getAllByRole("combobox")[0]);
    fireEvent.click(await within(themeStep).findByText("base"));

    await waitFor(() => {
      const root = container.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        "160 80% 40%"
      );
    });
  });

  it("restores progress after reload", async () => {
    const { unmount, container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    /* make some progress, switch theme */
    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    const details2 = screen.getByRole("heading", { name: "Shop Details" })
      .parentElement as HTMLElement;

    fireEvent.click(within(details2).getByRole("button", { name: /next/i }));

    const theme2 = screen.getByRole("heading", { name: "Select Theme" })
      .parentElement as HTMLElement;
    fireEvent.click(within(theme2).getAllByRole("combobox")[0]);
    fireEvent.click(await within(theme2).findByText("dark"));

    await waitFor(() => {
      const root = container.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        "220 90% 66%"
      );
    });

    unmount(); // simulate reload

    const { container: c2 } = render(
      <Wizard themes={themes} templates={templates} />
    );

    await screen.findByText("Select Theme");
    await waitFor(() => {
      const root = c2.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        "220 90% 66%"
      );
    });
  });

  it("calls save endpoint for home page", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "p1" }),
    });

    render(<Wizard themes={themes} templates={templates} />);

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    await runWizard({
      "Home Page": (c) => fireEvent.click(within(c).getByText("Save")),
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      "/cms/api/page-draft/shop"
    );
  });

  it("calls save endpoint for additional pages", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "p2" }),
    });

    render(<Wizard themes={themes} templates={templates} />);

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    await runWizard({
      "Additional Pages": (c) => {
        const utils = within(c);
        fireEvent.click(utils.getByText("Add Page"));
        fireEvent.click(utils.getByText("Save"));
      },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      "/cms/api/page-draft/shop"
    );
  });

  it("ignores invalid JSON in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "{bad");
    const { container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    expect(screen.getByText("Shop Details")).toBeInTheDocument();
    const root = container.firstChild as HTMLElement;
    expect(root.style.getPropertyValue("--color-primary")).toBe(
      baseTokens["--color-primary"]
    );
  });

  it("uses defaults when fields are missing", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 1 }));
    const { container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    await screen.findByText("Select Theme");
    const root = container.firstChild as HTMLElement;
    await waitFor(() => {
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        baseTokens["--color-primary"]
      );
    });
  });
});
