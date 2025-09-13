import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogOverlay,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../dialog";

configure({ testIdAttribute: "data-testid" });

describe("Dialog", () => {
  it("forwards refs and merges custom classes on overlay and content", () => {
    const overlayRef = React.createRef<HTMLDivElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
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
    expect(overlay).toHaveClass("bg-fg/50");

    const content = screen.getByRole("dialog");
    expect(contentRef.current).toBe(content);
    expect(content).toHaveClass("custom-content");
    expect(content).toHaveClass("bg-background");
  });

  it("forwards refs and merges custom classes on subcomponents", () => {
    const headerRef = React.createRef<HTMLDivElement>();
    const footerRef = React.createRef<HTMLDivElement>();
    const titleRef = React.createRef<HTMLHeadingElement>();
    const descriptionRef = React.createRef<HTMLParagraphElement>();

    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader
            ref={headerRef}
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
            ref={footerRef}
            data-testid="footer"
            className="custom-footer"
          >
            Footer
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByTestId("header");
    expect(headerRef.current).toBe(header);
    expect(header).toHaveClass("custom-header");
    expect(header).toHaveClass(
      "flex flex-col space-y-1.5 text-center sm:text-left"
    );

    const footer = screen.getByTestId("footer");
    expect(footerRef.current).toBe(footer);
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

  it("dismisses when close button is clicked", async () => {
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
    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
