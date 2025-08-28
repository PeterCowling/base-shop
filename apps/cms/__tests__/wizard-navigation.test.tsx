/* eslint-env jest */

import { runWizard, templates, themes } from "./utils/wizardTestUtils";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ResponseComposition, RestContext, RestRequest, rest } from "msw";
import { server } from "../../../test/msw/server";
import Wizard from "../src/app/cms/wizard/Wizard";

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("Wizard navigation", () => {
  it("submits configuration after navigating through steps", async () => {
    let capturedBody: unknown = null;

    server.use(
      rest.get("/cms/api/wizard-progress", (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ state: {}, completed: {} }))
      ),
      rest.put("/cms/api/wizard-progress", (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({}))
      ),
      rest.post(
        "/cms/api/configurator",
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
});
