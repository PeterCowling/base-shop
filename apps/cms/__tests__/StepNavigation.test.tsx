import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StepNavigation from "../src/app/cms/configurator/steps/StepNavigation";

// Provide missing pointer APIs for Radix Select used in DeviceSelector
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const pushMock = jest.fn();
const markComplete = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("../src/app/cms/configurator/ConfiguratorContext", () => ({
  useConfigurator: () => ({ state: { navItems: [] }, update: jest.fn() }),
}));

jest.mock("../src/app/cms/configurator/hooks/useStepCompletion", () => ({
  __esModule: true,
  default: () => [false, markComplete],
}));

jest.mock("../src/app/cms/configurator/hooks/useThemeLoader", () => ({
  useThemeLoader: () => ({}),
}));

jest.mock("../src/app/cms/configurator/components/NavTemplateSelector", () => ({
  __esModule: true,
  default: () => <div />, // no-op
}));

describe("StepNavigation", () => {
  it("resets orientation on device change and updates preview dimensions", async () => {
    const user = userEvent.setup();
    const { container } = render(<StepNavigation />);

    const rotate = screen.getByRole("button", { name: "Rotate" });
    const getPreview = () =>
      container.querySelector("div.mx-auto") as HTMLDivElement;

    // Switch to landscape on initial device
    await user.click(rotate);
    expect(getPreview()).toHaveStyle({ width: "800px", height: "1280px" });

    // Select a different device; orientation should reset to portrait
    await user.click(screen.getByLabelText("Device"));
    await user.click(await screen.findByRole("option", { name: "iPad" }));
    expect(getPreview()).toHaveStyle({ width: "768px", height: "1024px" });

    // Toggle orientation to landscape
    await user.click(rotate);
    expect(getPreview()).toHaveStyle({ width: "1024px", height: "768px" });

    // Toggle back to portrait
    await user.click(rotate);
    expect(getPreview()).toHaveStyle({ width: "768px", height: "1024px" });

    // Saving navigates back to configurator
    await user.click(screen.getByText("Save & return"));
    expect(pushMock).toHaveBeenCalledWith("/cms/configurator");
  });
});
