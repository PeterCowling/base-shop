import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { StatusIndicator } from "../StatusIndicator/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders room status label with semantic classes", () => {
    render(<StatusIndicator status="available" variant="room" />);

    const badge = screen.getByText("Available").closest("span.inline-flex");
    const dot = badge?.querySelector("span.inline-block.rounded-full");

    expect(badge).toHaveClass("bg-surface-1", "rounded-full");
    expect(screen.getByText("Available")).toHaveClass("text-foreground");
    expect(dot).toHaveClass("bg-success", "ring-success", "h-2.5", "w-2.5");
  });

  it("renders dot-only mode with semantic ring classes", () => {
    render(
      <StatusIndicator
        status="warning"
        variant="general"
        dotOnly={true}
        size="lg"
      />,
    );

    const dot = screen.getByLabelText("Warning");
    expect(dot).toHaveClass(
      "bg-warning",
      "ring-warning",
      "ring-offset-2",
      "h-3",
      "w-3",
    );
    expect(screen.queryByText("Warning")).not.toBeInTheDocument();
  });

  it("falls back to muted semantic classes for unknown status", () => {
    render(<StatusIndicator status="paused" variant="general" />);

    const badge = screen.getByText("Paused").closest("span.inline-flex");
    const dot = badge?.querySelector("span.inline-block.rounded-full");

    expect(dot).toHaveClass("bg-muted", "ring-muted");
    expect(screen.getByText("Paused")).toHaveClass("text-foreground");
  });

  it("supports custom label overrides and custom classes", () => {
    render(
      <StatusIndicator
        status="available"
        variant="room"
        label="Ready now"
        className="custom-badge"
      />,
    );

    const badge = screen.getByText("Ready now").closest("span.inline-flex");
    expect(badge).toHaveClass("custom-badge");
  });

  it("applies compact size classes when size is sm", () => {
    render(<StatusIndicator status="completed" variant="order" size="sm" />);

    const badge = screen.getByText("Completed").closest("span.inline-flex");
    const dot = badge?.querySelector("span.inline-block.rounded-full");

    expect(badge).toHaveClass("gap-1.5", "px-2", "py-0.5", "text-xs");
    expect(dot).toHaveClass("h-2", "w-2", "bg-success", "ring-success");
  });
});
