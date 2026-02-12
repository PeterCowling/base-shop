import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Progress } from "../Progress";

describe("Progress", () => {
  it("renders the label when provided", () => {
    render(<Progress value={50} label="Loading" />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("omits the label container when no label is given", () => {
    const { container } = render(<Progress value={50} />);
    expect(
      container.querySelector("[data-token='--color-muted-fg']")
    ).toBeNull();
  });
});
