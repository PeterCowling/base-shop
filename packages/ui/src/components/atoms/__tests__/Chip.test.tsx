import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "../Chip";

describe("Chip", () => {
  it("renders remove button and calls onRemove when clicked", async () => {
    const handleRemove = jest.fn();
    render(<Chip onRemove={handleRemove}>Chip</Chip>);
    const removeButton = screen.getByRole("button", { name: "x" });
    expect(removeButton).toBeInTheDocument();
    await userEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
