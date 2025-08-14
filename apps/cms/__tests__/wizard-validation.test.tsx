/* eslint-env jest */

import { templates, themes } from "./utils/wizardTestUtils";
import { render, screen, waitFor } from "@testing-library/react";
import { baseTokens } from "../src/app/cms/wizard/tokenUtils";
import { rest } from "msw";
import { server } from "../../../test/msw/server";
import Wizard from "../src/app/cms/wizard/Wizard";

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("Wizard validation", () => {
  it("ignores invalid progress state from the server", () => {
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

  it("uses defaults when progress fields are missing", async () => {
    server.use(
      rest.get("/cms/api/wizard-progress", (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ state: {}, completed: {} }))
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
