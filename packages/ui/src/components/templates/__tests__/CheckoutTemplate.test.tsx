import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CheckoutTemplate } from "../CheckoutTemplate";
import "../../../../../../test/resetNextMocks";

describe("CheckoutTemplate", () => {
  it("navigates steps and completes", async () => {
    const steps = [
      { label: "Step 1", content: <div>One</div> },
      { label: "Step 2", content: <div>Two</div> },
      { label: "Step 3", content: <div>Three</div> },
    ];

    const onStepChange = jest.fn();
    const onComplete = jest.fn();

    render(
      <CheckoutTemplate
        steps={steps}
        onStepChange={onStepChange}
        onComplete={onComplete}
      />
    );

    onStepChange.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onStepChange).toHaveBeenCalledWith(1);
    expect(screen.getByText("Step 2")).toHaveClass("font-medium");
    expect(screen.getByText("Step 1")).not.toHaveClass("font-medium");

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onStepChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByText("Step 1")).toHaveClass("font-medium");
    expect(screen.getByText("Step 2")).not.toHaveClass("font-medium");

    onStepChange.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onStepChange).toHaveBeenNthCalledWith(1, 1);
    expect(onStepChange).toHaveBeenNthCalledWith(2, 2);
    expect(screen.getByText("Step 3")).toHaveClass("font-medium");

    await userEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(onComplete).toHaveBeenCalled();
  });
});

