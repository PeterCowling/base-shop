import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "../Toast";

describe("Toast", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<Toast open={false} message="Hidden" />);
    expect(container.firstChild).toBeNull();
  });

  it("invokes onClose when the dismiss button is clicked", async () => {
    const onClose = jest.fn();
    render(<Toast open message="Saved" onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "×" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
