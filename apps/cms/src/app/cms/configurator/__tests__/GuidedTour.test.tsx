import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
jest.mock("@acme/i18n", () => ({
  useTranslations: () => {
    const dictionary: Record<string, (options?: Record<string, unknown>) => string> = {
      "pb.tour.next": () => "Next",
      "pb.tour.back": () => "Back",
      "pb.tour.skip": () => "Skip",
      "pb.tour.done": () => "Done",
      "pb.tour.stepXofY": (options) =>
        `Step ${options?.current ?? "?"} of ${options?.total ?? "?"}`,
    };

    return (key: string, options?: Record<string, unknown>) =>
      dictionary[key]?.(options) ?? key;
  },
}));

import GuidedTour, { useGuidedTour } from "../GuidedTour";

function ReplayButton(): React.JSX.Element {
  const { replay } = useGuidedTour();
  return <button onClick={replay}>Replay</button>;
}

describe("GuidedTour", () => {
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    localStorage.clear();
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 100,
      width: 200,
      height: 50,
      bottom: 150,
      right: 300,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }));
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it("updates localStorage through the tour lifecycle", async () => {
    render(
      <GuidedTour>
        <div data-tour="quest-basics">basics</div>
        <div data-tour="quest-theme">theme</div>
        <div data-tour="quest-payments">payments</div>
        <div data-tour="quest-shipping">shipping</div>
        <div data-tour="quest-product">product</div>
        <div data-tour="quest-checkout">checkout</div>
        <div data-tour="quest-launch">launch</div>
        <ReplayButton />
      </GuidedTour>
    );

    await waitFor(() =>
      expect(localStorage.getItem("configurator-guided-tour")).toBe("0")
    );

    await userEvent.click(screen.getByText("Next"));
    expect(localStorage.getItem("configurator-guided-tour")).toBe("1");

    await userEvent.click(screen.getByText("Back"));
    expect(localStorage.getItem("configurator-guided-tour")).toBe("0");

    await userEvent.click(screen.getByText("Skip"));
    expect(localStorage.getItem("configurator-guided-tour")).toBe("done");

    await userEvent.click(screen.getByText("Replay"));
    expect(localStorage.getItem("configurator-guided-tour")).toBe("0");
  });
});
