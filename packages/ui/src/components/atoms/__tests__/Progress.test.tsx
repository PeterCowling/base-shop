import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Progress } from "../Progress";

describe("Progress", () => {
  it("renders no label when not provided", () => {
    const { container } = render(<Progress value={50} />);
    expect(container.querySelector("[data-token='--color-muted-fg']")).toBeNull();
  });

  it("renders the label when provided", () => {
    render(<Progress value={50} label="Loading" />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});
