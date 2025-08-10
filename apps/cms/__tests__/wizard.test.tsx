// apps/cms/__tests__/wizard.test.tsx
/* eslint-env jest */

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
import { baseTokens } from "../src/app/cms/wizard/tokenUtils";

/* -------------------------------------------------------------------------- */
/*  External stubs                                                            */
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
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const themes = ["base", "dark"];
const templates = ["template-app"];
const NEXT_LABEL = /^(next|continue|save & continue)$/i;

/** Resolve the container that represents the *currently active* step.
 *  Heuristic: the first enabled “Next / Continue / Save & Continue” button
 *  belongs to the active step. */
function getActiveStepContainer(): HTMLElement {
  const nextBtns = screen.getAllByRole("button", { name: NEXT_LABEL });
  const activeNext = nextBtns.find((btn) => !btn.hasAttribute("disabled"));
  if (!activeNext) {
    throw new Error("Unable to locate an enabled navigation button");
  }
  return (activeNext.closest("fieldset") ??
    activeNext.closest("div")) as HTMLElement;
}

/** Generic step‑through helper: clicks “Next / Continue” until the wizard
 *  arrives at the “Summary” / “Hosting” step.  Optional callbacks can hook
 *  into individual steps by **heading text**. */
async function runWizard(
  actions: Record<string, (container: HTMLElement) => void> = {}
) {
  // Ensure the first step is rendered
  await screen.findByRole("heading", { name: /shop details/i });

  /* eslint-disable no-await-in-loop */
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
  /* eslint-enable no-await-in-loop */
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

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

    // move to Select Theme step
    fireEvent.click(
      within(getActiveStepContainer()).getByRole("button", { name: NEXT_LABEL })
    );

    const themeStep = getActiveStepContainer();
    fireEvent.click(within(themeStep).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: /^base$/i }));

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

    /* make some progress & choose the dark theme */
    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });
    fireEvent.click(
      within(getActiveStepContainer()).getByRole("button", { name: NEXT_LABEL })
    );

    const themeStep = getActiveStepContainer();
    fireEvent.click(within(themeStep).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: /^dark$/i }));

    const selectedPrimary = (
      container.firstChild as HTMLElement
    ).style.getPropertyValue("--color-primary");

    /* advance once so the wizard persists state */
    fireEvent.click(
      within(themeStep).getByRole("button", { name: NEXT_LABEL })
    );

    unmount(); // simulate reload

    const { container: c2 } = render(
      <Wizard themes={themes} templates={templates} />
    );

    await screen.findByRole("heading", { name: /select theme/i });
    await waitFor(() => {
      const root = c2.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        selectedPrimary
      );
    });
  });

  it("calls save endpoint for home page", async () => {
    server.use(
      rest.post("/cms/api/page-draft/shop", (_req, res, ctx) =>
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
      rest.post("/cms/api/page-draft/shop", (_req, res, ctx) =>
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
        fireEvent.click(utils.getByText(/add page/i));
        fireEvent.click(utils.getByText("Save"));
      },
    });

    await waitFor(() =>
      expect(
        fetchSpy.mock.calls.some((c) =>
          String(c[0]).includes("/cms/api/page-draft/shop")
        )
      ).toBe(true)
    );
  });

  it("ignores invalid state from server", () => {
    server.use(
      rest.get("/cms/api/wizard-progress", (_req, res, ctx) =>
        res(ctx.status(200), ctx.body("{bad"))
      )
    );
    const { container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    const root = container.firstChild as HTMLElement;
    expect(root.style.getPropertyValue("--color-primary")).toBe(
      baseTokens["--color-primary"]
    );
  });

  it("uses defaults when fields are missing", async () => {
    server.use(
      rest.get("/cms/api/wizard-progress", (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ step: 1 }))
      )
    );
    const { container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    await screen.findByRole("heading", { name: /select theme/i });
    await waitFor(() => {
      const root = container.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        baseTokens["--color-primary"]
      );
    });
  });
});
