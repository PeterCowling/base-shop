/* eslint-env jest */

import {
  NEXT_LABEL,
  getActiveStepContainer,
  templates,
  themes,
} from "./utils/wizardTestUtils";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";

/* -------------------------------------------------------------------------- */
/*  Tests                                                                     */
/* -------------------------------------------------------------------------- */
describe("Wizard theme selection", () => {
  it("loads token values for a newly added theme", async () => {
    const { container } = render(
      <Wizard themes={themes} templates={templates} />
    );

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });

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
});
