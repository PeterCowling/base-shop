// apps/cms/__tests__/wizard.test.tsx
/* eslint-env jest */
// --------------------------------------------------------------------------
// Integration-style tests for the CMS Wizard
// --------------------------------------------------------------------------
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ResponseComposition, rest, RestContext, RestRequest } from "msw";
import { server } from "../../../test/msw/server";

import Wizard from "../src/app/cms/wizard/Wizard";
import { baseTokens, STORAGE_KEY } from "../src/app/cms/wizard/utils";

/* -------------------------------------------------------------------------- */
/*  External-module stubs                                                     */
/* -------------------------------------------------------------------------- */

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
/*  Test data / helpers                                                       */
/* -------------------------------------------------------------------------- */

const themes = ["base", "dark"];
const templates = ["template-app"];

const stepHeadings = [
  "Shop Details",
  "Select Theme",
  "Color Palette",
  "Customize Tokens",
  "Options",
  "Navigation",
  "Layout",
  "Home Page",
  "Checkout Page",
  "Shop Page",
  "Product Page",
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

    actions[heading]?.(container);

    if (heading === "Hosting") break;

    const nextBtn = within(container).getAllByRole("button", {
      name: /next|save & continue/i,
    })[0];
    fireEvent.click(nextBtn);
  }
};

/* -------------------------------------------------------------------------- */
/*  jsdom polyfills / spies                                                   */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  jest.spyOn(global, "fetch");
  Element.prototype.scrollIntoView = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  (global.fetch as jest.Mock).mockRestore();
  localStorage.clear();
});

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */

describe("Wizard", () => {
  it("submits after navigating steps", async () => {
    let capturedBody: unknown = null;

    server.use(
      rest.post(
        "/cms/api/create-shop",
        async (
          req: RestRequest,
          res: ResponseComposition,
          ctx: RestContext
        ) => {
          capturedBody = await req.json();
          return res(ctx.status(200), ctx.json({ success: true }));
        }
      )
    );

    render(<Wizard themes={themes} templates={templates} />);

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "testshop" },
    });

    await runWizard({
      Summary: (c) =>
        fireEvent.click(
          within(c).getByRole("button", { name: /create shop/i })
        ),
    });

    await screen.findByText(/shop created successfully/i);

    expect(capturedBody).toEqual(expect.objectContaining({ id: "testshop" }));
  });

  it("loads tokens for a newly added theme", async () => {
    const { container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    /* shop details */
    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    fireEvent.click(
      within(
        screen.getByRole("heading", { name: "Shop Details" })
          .parentElement as HTMLElement
      ).getByRole("button", { name: /next/i })
    );

    /* select theme */
    const themeStep = screen.getByRole("heading", { name: "Select Theme" })
      .parentElement as HTMLElement;

    fireEvent.click(within(themeStep).getAllByRole("combobox")[0]);
    fireEvent.click(await within(themeStep).findByText("base"));

    await waitFor(() => {
      const root = container.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        "220 90% 56%"
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

    fireEvent.click(
      within(
        screen.getByRole("heading", { name: "Shop Details" })
          .parentElement as HTMLElement
      ).getByRole("button", { name: /next/i })
    );

    const themeStep = screen.getByRole("heading", { name: "Select Theme" })
      .parentElement as HTMLElement;

    fireEvent.click(within(themeStep).getAllByRole("combobox")[0]);
    fireEvent.click(await within(themeStep).findByText("dark"));

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
    server.use(
      rest.post("/cms/api/page-draft/shop", (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ id: "p1" }))
      )
    );

    const fetchSpy = jest.spyOn(global, "fetch");

    render(<Wizard themes={themes} templates={templates} />);

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    await runWizard({
      "Home Page": (c) => fireEvent.click(within(c).getByText("Save")),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    expect(fetchSpy.mock.calls[0][0]).toContain("/cms/api/page-draft/shop");
  });

  it("calls save endpoint for additional pages", async () => {
    server.use(
      rest.post("/cms/api/page-draft/shop", (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ id: "p2" }))
      )
    );

    const fetchSpy = jest.spyOn(global, "fetch");

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

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    expect(fetchSpy.mock.calls[0][0]).toContain("/cms/api/page-draft/shop");
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
