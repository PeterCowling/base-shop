import { fireEvent, render, screen, within } from "@testing-library/react";

// Use the @cms alias to reference the Wizard component located in the CMS app
// instead of a relative path that does not resolve correctly from this package.
import Wizard from "@cms/app/cms/wizard/Wizard";

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

async function runWizard(
  actions: Record<string, StepCallback> = {}
): Promise<void> {
  for (const heading of stepHeadings) {
    const el = await screen.findByRole("heading", { name: heading });
    const container =
      (el.closest("div") as HTMLElement) ||
      (el.closest("fieldset") as HTMLElement);
    if (actions[heading]) actions[heading](container);
    if (heading === "Hosting") break;
    const next = within(container).getAllByRole("button", {
      name: /next|save & continue/i,
    })[0];
    fireEvent.click(next);
  }
}

it("submits selected options to create shop", async () => {
  let body: any = null;
  server.use(
    rest.post("/cms/api/create-shop", async (req, res, ctx) => {
      body = await req.json();
      return res(ctx.status(200), ctx.json({ success: true }));
    })
  );

  render(<Wizard themes={["base", "dark"]} templates={["tmpl1", "tmpl2"]} />);

  await runWizard({
    Summary: (c) =>
      fireEvent.click(within(c).getByRole("button", { name: "Create Shop" })),
  });

  await screen.findByText("Shop created successfully");

  expect(body).toEqual({
    id: "shop123",
    template: "tmpl1",
    theme: "base",
    payment: ["stripe"],
    shipping: ["dhl"],
  });
});

it("shows error when create shop fails", async () => {
  server.use(
    rest.post("/cms/api/create-shop", (_req, res, ctx) => {
      return res(ctx.status(400), ctx.json({ error: "boom" }));
    })
  );

  render(<Wizard themes={["base", "dark"]} templates={["tmpl1"]} />);

  fireEvent.change(screen.getByPlaceholderText("my-shop"), {
    target: { value: "shop123" },
  });
  await runWizard({
    Summary: (c) =>
      fireEvent.click(within(c).getByRole("button", { name: "Create Shop" })),
  });

  await screen.findByText("boom");
  expect(screen.getByRole("button", { name: "Create Shop" })).toBeEnabled();
});
