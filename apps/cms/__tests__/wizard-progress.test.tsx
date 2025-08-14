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
describe("Wizard progress persistence", () => {
  it("restores progress after a reload", async () => {
    const { unmount, container } = render(
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
    fireEvent.click(await screen.findByRole("option", { name: /^dark$/i }));

    const selectedPrimary = (
      container.firstChild as HTMLElement
    ).style.getPropertyValue("--color-primary");

    fireEvent.click(
      within(themeStep).getByRole("button", { name: NEXT_LABEL })
    );

    unmount();

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
});
