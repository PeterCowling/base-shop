import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { JumpLinkButton } from "../JumpLinkButton";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, ...props }: any) =>
      React.createElement("button", props, children),
  };
});

describe("JumpLinkButton", () => {
  it("scrolls and focuses the target when clicked", () => {
    const target = document.createElement("div");
    target.id = "jump-link-target";
    const scrollIntoView = jest.fn<void, Parameters<typeof target.scrollIntoView>>();
    const focus = jest.fn<void, Parameters<typeof target.focus>>();
    target.scrollIntoView =
      scrollIntoView as unknown as typeof target.scrollIntoView;
    target.focus = focus as unknown as typeof target.focus;
    document.body.appendChild(target);

    const handleClick = jest.fn();

    try {
      render(
        <JumpLinkButton targetId="jump-link-target" onClick={handleClick}>
          Jump
        </JumpLinkButton>
      );

      fireEvent.click(screen.getByRole("button", { name: "Jump" }));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      target.remove();
    }
  });

  it("skips scrolling and focus when the click is prevented", () => {
    const target = document.createElement("div");
    target.id = "jump-link-target";
    const scrollIntoView = jest.fn<void, Parameters<typeof target.scrollIntoView>>();
    const focus = jest.fn<void, Parameters<typeof target.focus>>();
    target.scrollIntoView =
      scrollIntoView as unknown as typeof target.scrollIntoView;
    target.focus = focus as unknown as typeof target.focus;
    document.body.appendChild(target);

    const handleClick = jest.fn((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });

    try {
      render(
        <JumpLinkButton targetId="jump-link-target" onClick={handleClick}>
          Jump
        </JumpLinkButton>
      );

      fireEvent.click(screen.getByRole("button", { name: "Jump" }));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(focus).not.toHaveBeenCalled();
    } finally {
      target.remove();
    }
  });

  it("defaults the button type to \"button\" but allows overrides", () => {
    const { rerender } = render(
      <JumpLinkButton targetId="jump-link-target">Jump</JumpLinkButton>
    );

    expect(screen.getByRole("button", { name: "Jump" })).toHaveAttribute(
      "type",
      "button"
    );

    rerender(
      <JumpLinkButton targetId="jump-link-target" type="submit">
        Jump
      </JumpLinkButton>
    );

    expect(screen.getByRole("button", { name: "Jump" })).toHaveAttribute(
      "type",
      "submit"
    );
  });
});
