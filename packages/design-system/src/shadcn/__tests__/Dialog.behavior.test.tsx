import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../Dialog";

describe("Dialog behaviors", () => {
  it("calls onOpenChange for open and close via trigger + close button", async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Short help</DialogDescription>
          Body
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText("Open"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    expect(await screen.findByText("Body")).toBeInTheDocument();

    // Close via built-in Close button
    await user.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("closes on Escape key", async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>A title</DialogTitle>
          <DialogDescription>Helps screen readers</DialogDescription>
          Content
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByText("Open"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    expect(await screen.findByText("Content")).toBeInTheDocument();

    // Escape should close the dialog
    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
