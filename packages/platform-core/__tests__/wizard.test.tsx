import { fireEvent, render, screen } from "@testing-library/react";
import { rest, server } from "../../../test/mswServer";
// Use the @cms alias to reference the Wizard component located in the CMS app
// instead of a relative path that does not resolve correctly from this package.
import Wizard from "@cms/app/cms/wizard/Wizard";

it("submits selected options to create shop", async () => {
  let body: any = null;
  server.use(
    rest.post("/cms/api/create-shop", async (req, res, ctx) => {
      body = await req.json();
      return res(ctx.status(200), ctx.json({ success: true }));
    })
  );

  render(<Wizard themes={["base", "dark"]} templates={["tmpl1", "tmpl2"]} />);

  // step 0
  fireEvent.change(screen.getByPlaceholderText("my-shop"), {
    target: { value: "shop123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // step 1
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // step 2
  fireEvent.click(screen.getByLabelText("Stripe"));
  fireEvent.click(screen.getByLabelText("DHL"));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // submit step
  fireEvent.click(screen.getByRole("button", { name: "Create Shop" }));

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
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  fireEvent.click(screen.getByRole("button", { name: "Create Shop" }));

  await screen.findByText("boom");
  expect(screen.getByRole("button", { name: "Create Shop" })).toBeEnabled();
});
