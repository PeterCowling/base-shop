import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "../Toast";

describe("Toast", () => {
  it("renders message when open", () => {
    render(<Toast open message="Saved" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
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
