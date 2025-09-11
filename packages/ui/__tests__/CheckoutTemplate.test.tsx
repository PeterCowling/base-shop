import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutTemplate } from "../src/components/templates/CheckoutTemplate";

const steps = [
  { label: "Step 1", content: <div>One</div> },
  { label: "Step 2", content: <div>Two</div> },
];

describe("CheckoutTemplate", () => {
  it("advances and retreats steps calling onStepChange", async () => {
    const onStepChange = jest.fn();
    render(<CheckoutTemplate steps={steps} onStepChange={onStepChange} />);

    expect(onStepChange).toHaveBeenCalledWith(0);
    expect(screen.getByText("One")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByText("Two")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onStepChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("calls onComplete when finishing last step", async () => {
    const onComplete = jest.fn();
    const onStepChange = jest.fn();
    render(
      <CheckoutTemplate
        steps={steps}
        onStepChange={onStepChange}
        onComplete={onComplete}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Finish" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledTimes(2);
    expect(onStepChange).toHaveBeenLastCalledWith(1);
  });
});
