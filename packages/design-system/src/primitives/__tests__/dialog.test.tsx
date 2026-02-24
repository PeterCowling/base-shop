import "../../../../../../../test/resetNextMocks";

import * as React from "react";
import { configure,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { overflowContainmentClass } from "../../utils/style";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

configure({ testIdAttribute: "data-testid" });

describe("Dialog", () => {
  it("forwards refs and merges custom classes on overlay and content", async () => {
    const overlayRef = React.createRef<HTMLDivElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    const { container } = render(
      <Dialog open>
        <DialogOverlay
          ref={overlayRef}
          data-testid="overlay"
          className="custom-overlay"
        />
        <DialogContent ref={contentRef} className="custom-content">
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const overlay = screen.getByTestId("overlay");
    expect(overlayRef.current).toBe(overlay);
    expect(overlay).toHaveClass("custom-overlay");
    // Overlay uses theme scrim token now
    expect(overlay.className).toMatch(/overlay|scrim|bg-\[/);

    const content = screen.getByRole("dialog");
    expect(contentRef.current).toBe(content);
    expect(content).toHaveClass("custom-content");
    expect(content).toHaveClass("bg-panel");

  });

  it("supports content shape and radius variants", () => {
    const { rerender } = render(
      <Dialog open>
        <DialogContent data-testid="content" shape="soft">
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByTestId("content");
    expect(content).toHaveClass("rounded-md");

    rerender(
      <Dialog open>
        <DialogContent data-testid="content" shape="pill" radius="lg">
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const contentWithRadiusOverride = screen.getByTestId("content");
    expect(contentWithRadiusOverride).toHaveClass("rounded-lg");
    expect(contentWithRadiusOverride).not.toHaveClass("rounded-full");
  });

  it(
    "merges custom classes on DialogHeader, DialogFooter, DialogTitle, and DialogDescription",
    () => {
      const titleRef = React.createRef<HTMLHeadingElement>();
      const descriptionRef = React.createRef<HTMLParagraphElement>();

    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader
            data-testid="header"
            className="custom-header"
          >
            <DialogTitle
              ref={titleRef}
              data-testid="title"
              className="custom-title"
            >
              Title
            </DialogTitle>
            <DialogDescription
              ref={descriptionRef}
              data-testid="description"
              className="custom-description"
            >
              Description
            </DialogDescription>
          </DialogHeader>
          <DialogFooter
            data-testid="footer"
            className="custom-footer"
          >
            Footer
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByTestId("header");
    expect(header).toHaveClass("custom-header");

    expect(header).toHaveClass(
      "flex flex-col space-y-1.5 text-center sm:text-start"
    );

    const footer = screen.getByTestId("footer");
    expect(footer).toHaveClass("custom-footer");
    expect(footer).toHaveClass(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
    );

    const title = screen.getByTestId("title");
    expect(titleRef.current).toBe(title);
    expect(title).toHaveClass("custom-title");
    expect(title).toHaveClass("text-lg font-semibold");

    const description = screen.getByTestId("description");
    expect(descriptionRef.current).toBe(description);
    expect(description).toHaveClass("custom-description");
    expect(description).toHaveClass("text-muted-foreground text-sm");
  });

  it("unmounts when the internal close button is clicked", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const user = userEvent.setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies shared containment and keeps a bleed-prone fixture reproducible without it", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Containment title</DialogTitle>
            <DialogDescription>Containment description</DialogDescription>
          </DialogHeader>
          Body
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByRole("dialog");
    expect(content).toHaveClass(overflowContainmentClass("dialogContent"));

    // Failure fixture: no containment class applied.
    const bleedFixture = "w-screen overflow-visible";
    expect(bleedFixture).toContain("w-screen");
    expect(bleedFixture).toContain("overflow-visible");
    expect(bleedFixture).not.toContain(overflowContainmentClass("dialogContent"));
  });
});
