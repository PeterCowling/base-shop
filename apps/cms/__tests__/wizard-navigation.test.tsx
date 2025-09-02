/* eslint-env jest */

import { runWizard, templates, themes } from "./utils/wizardTestUtils";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { server } from "./msw/server";
import Wizard from "../src/app/cms/wizard/Wizard";

const atoms = require("@/components/atoms");
atoms.Toast = ({ open, message }: { open: boolean; message: string }) =>
  open ? <div role="status">{message}</div> : null;

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("Wizard navigation", () => {
  it("submits configuration after navigating through steps", async () => {
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

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/cms/api/configurator",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("testshop"),
        })
      )
    );
  });
});
