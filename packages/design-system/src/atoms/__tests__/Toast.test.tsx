import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Toast } from "../Toast";

describe("Toast", () => {
  it("renders message when open", async () => {
    const { container } = render(<Toast open message="Saved" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();

  });

  it("supports placement and action", async () => {
    const handleAction = jest.fn();
    const handleClose = jest.fn();
    render(
      <Toast
        open
        message="With action"
        placement="top-end"
        actionLabel="Undo"
        onAction={handleAction}
        onClose={handleClose}
      />
    );
    const toast = screen.getByRole("alert");
    expect(toast.className).toContain("top-4");

    expect(toast.className).toContain("end-4");
    await userEvent.click(screen.getByText("Undo"));
    expect(handleAction).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    const { container } = render(<Toast open={false} message="Hidden" />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onClose when dismiss button clicked", async () => {
    const handleClose = jest.fn();
    render(<Toast open message="Saved" onClose={handleClose} />);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClose).toHaveBeenCalled();
  });
});
