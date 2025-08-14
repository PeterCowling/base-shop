/* eslint-env jest */

import { templates, themes, runWizard } from "./utils/wizardTestUtils";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { rest } from "msw";
import { server } from "../../../test/msw/server";
import Wizard from "../src/app/cms/wizard/Wizard";

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("Wizard page saving", () => {
  it("calls save endpoint when saving the home page", async () => {
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
    expect(
      fetchSpy.mock.calls.some((c) =>
        String(c[0]).includes("/cms/api/page-draft/shop")
      )
    ).toBe(true);
  });

  it("calls save endpoint when saving additional pages", async () => {
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
});
