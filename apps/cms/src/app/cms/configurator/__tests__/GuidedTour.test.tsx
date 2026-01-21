import type { ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import GuidedTour, { useGuidedTour } from "../GuidedTour";

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

function ReplayButton(): ReactElement {
  const { replay } = useGuidedTour();
  return <button onClick={replay}>Replay</button>;
}

describe("GuidedTour", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates localStorage through the tour lifecycle", async () => {
    render(
      <GuidedTour>
        <div data-tour="select-template">template</div>
        <div data-tour="drag-component">drag</div>
        <div data-tour="edit-properties">edit</div>
        <div data-tour="preview">preview</div>
        <div data-tour="publish">publish</div>
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
