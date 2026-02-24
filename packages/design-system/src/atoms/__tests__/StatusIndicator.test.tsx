import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { StatusIndicator } from "../StatusIndicator/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders semantic label for known variant statuses", () => {
    render(<StatusIndicator status="available" variant="room" />);
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("supports dot-only mode with accessible label", () => {
    render(<StatusIndicator status="success" variant="general" dotOnly />);
    const dot = screen.getByLabelText("Success");
    expect(dot).toHaveAttribute("title", "Success");
  });

  it("supports shape/radius overrides for badge and dot", () => {
    const { rerender } = render(
      <StatusIndicator
        status="available"
        variant="room"
        shape="square"
        dotShape="square"
      />,
    );

    let label = screen.getByText("Available");
    let badge = label.parentElement;
    let dot = badge?.querySelector("[aria-hidden='true']");

    expect(badge).toHaveClass("rounded-none");
    expect(dot).toHaveClass("rounded-none");

    rerender(
      <StatusIndicator
        status="available"
        variant="room"
        shape="square"
        radius="xl"
        dotShape="square"
        dotRadius="2xl"
      />,
    );

    label = screen.getByText("Available");
    badge = label.parentElement;
    dot = badge?.querySelector("[aria-hidden='true']");
    expect(badge).toHaveClass("rounded-xl");
    expect(dot).toHaveClass("rounded-2xl");
  });
});
