import "../../../../../../../test/resetNextMocks";
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
  it("merges custom classes on overlay and content", () => {
    render(
      <Dialog open>
        <DialogOverlay data-testid="overlay" className="custom-overlay" />
        <DialogContent className="custom-content">
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const overlay = screen.getByTestId("overlay");
    expect(overlay).toHaveClass("custom-overlay");
    expect(overlay).toHaveClass("bg-fg/50");

    const content = screen.getByRole("dialog");
    expect(content).toHaveClass("custom-content");
    expect(content).toHaveClass("bg-background");
  });

  it("renders subcomponents with correct classes", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle data-testid="title">Title</DialogTitle>
            <DialogDescription data-testid="description">
              Description
            </DialogDescription>
          </DialogHeader>
          <DialogFooter data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByTestId("header")).toHaveClass(
      "flex flex-col space-y-1.5 text-center sm:text-left"
    );
    expect(screen.getByTestId("footer")).toHaveClass(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
    );
    expect(screen.getByTestId("title")).toHaveClass("text-lg font-semibold");
    expect(screen.getByTestId("description")).toHaveClass(
      "text-muted-foreground text-sm"
    );
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
