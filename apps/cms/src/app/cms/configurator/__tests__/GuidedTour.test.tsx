import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuidedTour, { useGuidedTour } from "../GuidedTour";

function ReplayButton(): JSX.Element {
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
