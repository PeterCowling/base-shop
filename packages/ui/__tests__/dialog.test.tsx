import * as React from "react";
import { fireEvent, render, screen, waitFor, configure } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../src/components/atoms/shadcn";

configure({ testIdAttribute: "data-testid" });

describe("dialog primitives", () => {
  it("forwards refs and merges class names", async () => {
    const overlayRef = React.createRef<HTMLDivElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    const headerRef = React.createRef<HTMLDivElement>();
    const footerRef = React.createRef<HTMLDivElement>();
    const titleRef = React.createRef<HTMLHeadingElement>();
    const descriptionRef = React.createRef<HTMLParagraphElement>();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogOverlay
            ref={overlayRef}
            data-testid="overlay"
            className="custom-overlay"
          />
          <DialogContent
            ref={contentRef}
            data-testid="content"
            className="custom-content"
          >
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
            />
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );

    fireEvent.click(screen.getByText("Open"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    expect(overlayRef.current).toBeInstanceOf(HTMLElement);
    expect(contentRef.current).toBeInstanceOf(HTMLElement);
    expect(headerRef.current).toBeInstanceOf(HTMLElement);
    expect(footerRef.current).toBeInstanceOf(HTMLElement);
    expect(titleRef.current).toBeInstanceOf(HTMLElement);
    expect(descriptionRef.current).toBeInstanceOf(HTMLElement);

    expect(overlayRef.current).toHaveClass("custom-overlay");
    expect(contentRef.current).toHaveClass("custom-content");
    expect(headerRef.current).toHaveClass("custom-header");
    expect(footerRef.current).toHaveClass("custom-footer");
    expect(titleRef.current).toHaveClass("custom-title");
    expect(descriptionRef.current).toHaveClass("custom-description");
  });

  it("closes when the overlay is clicked", async () => {
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

    fireEvent.click(screen.getByText("Open"));
    const overlay = document.querySelector(
      "div[data-state='open'][data-aria-hidden='true']"
    ) as HTMLElement;
    const user = userEvent.setup();
    await user.click(overlay);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("closes when escape key is pressed", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );

    fireEvent.click(screen.getByText("Open"));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });
});

