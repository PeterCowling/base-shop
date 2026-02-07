import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import { Icon } from "../src/components/atoms/Icon";
import { Switch } from "../src/components/atoms/Switch";
import { Toast } from "../src/components/atoms/Toast";
import { Tooltip } from "../src/components/atoms/Tooltip";
import { VideoPlayer } from "../src/components/atoms/VideoPlayer";

describe("Switch, Toast, Icon, VideoPlayer, Tooltip", () => {
  it("Switch toggles checked state and has tokens", () => {
    const { container } = render(<Switch aria-label="toggle" defaultChecked />);
    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();
    fireEvent.click(input);
    expect(input).not.toBeChecked();
    const track = container.querySelector('[data-token="--color-primary"]');
    expect(track).not.toBeNull();
  });

  it("Toast renders when open with message and close button triggers handler", () => {
    const onClose = jest.fn();
    render(
      <Toast open message="Saved" variant="success" onClose={onClose} />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Saved");
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalled();
  });

  it("Toast supports error variant tokens and returns null when closed", () => {
    const { rerender, container } = render(
      <Toast open message="Oops" variant="error" />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-token", "--color-danger");
    expect(alert.textContent).toContain("Oops");

    rerender(<Toast open={false} message="Oops" />);
    expect(container.firstChild).toBeNull();
  });

  it("Icon renders the requested icon names", () => {
    const { container, rerender } = render(<Icon name="star" aria-hidden />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    rerender(<Icon name="user" aria-hidden />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("VideoPlayer renders controls and merges className", () => {
    const { container, rerender } = render(<VideoPlayer src="#" />);
    const el = container.querySelector("video")!;
    expect(el.hasAttribute("controls")).toBe(true);
    expect(el.className).toMatch(/rounded-lg/);
    rerender(<VideoPlayer src="#" className="h-20" />);
    expect(container.querySelector("video")!.className).toMatch(/h-20/);
  });

  it("Tooltip wraps children, includes text node with aria-hidden", () => {
    render(
      <Tooltip text="Help"><button>?</button></Tooltip>
    );
    expect(screen.getByText("?")).toBeInTheDocument();
    const tip = screen.getByText("Help");
    expect(tip).toBeInTheDocument();
    expect(tip).toHaveAttribute("aria-hidden", "true");
  });
});
