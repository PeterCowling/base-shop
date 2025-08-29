/* eslint-env jest */

import { runWizard, templates, themes } from "./utils/wizardTestUtils";
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";
import { configuratorRequests } from "./msw/handlers";

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

    await waitFor(() => {
      expect(configuratorRequests[0]).toEqual(
        expect.objectContaining({ id: "testshop" })
      );
    });
  });
});
