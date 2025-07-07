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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";
import { STORAGE_KEY, baseTokens } from "../src/app/cms/wizard/utils";

/* -------------------------------------------------------------------------- */
/*  Test data / helpers                                                       */
/* -------------------------------------------------------------------------- */

const themes = ["base", "dark"];
const templates = ["template-app"];

/**
 * Returns the first enabled "Next" button currently rendered.
 * Some wizard steps remain in the DOM but are hidden, so RTL can
 * detect multiple buttons with the same label.  We explicitly pick
 * the first button that is *not* disabled to avoid the ambiguity
 * error from `getByText`.
 */
const getActiveNextButton = (): HTMLElement => {
  const buttons = screen.getAllByRole("button", { name: /next/i });
  const enabled = buttons.find((b) => !b.hasAttribute("disabled"));
  return enabled ?? buttons[0];
};

const clickNextTimes = (times: number): void => {
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(getActiveNextButton());
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

    clickNextTimes(3);

    fireEvent.click(screen.getByText("Create Shop"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("loads tokens for a newly added theme", async () => {
    const { container } = render(
      <Wizard themes={["base", "abc"]} templates={templates} />
    );

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    fireEvent.click(getActiveNextButton());

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("abc"));

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

    fireEvent.click(getActiveNextButton());

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("dark"));

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

    clickNextTimes(5);

    fireEvent.click(screen.getByText("Save"));

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

    clickNextTimes(7);

    fireEvent.click(screen.getByText("Add Page"));
    fireEvent.click(screen.getByText("Save"));

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
