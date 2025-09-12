import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../src/components/atoms/shadcn";

describe("Dialog", () => {
  it("opens and closes with focus restoration and class overrides", async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="custom-dialog">
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("custom-dialog");

    const close = screen.getByRole("button", { name: /close/i });
    fireEvent.click(close);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
