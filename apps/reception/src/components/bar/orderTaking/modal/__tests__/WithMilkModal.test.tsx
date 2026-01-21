import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WithMilkModal from "../WithMilkModal";

describe("WithMilkModal", () => {
  it("renders milk options and selects each", async () => {
    const onSelectMilkOption = jest.fn();
    render(
      <WithMilkModal
        productName="Latte"
        basePrice={5}
        onSelectMilkOption={onSelectMilkOption}
        onCancel={jest.fn()}
      />
    );

    const withMilk = screen.getByRole("button", { name: /with milk/i });
    const withoutMilk = screen.getByRole("button", { name: /without milk/i });
    expect(withMilk).toBeInTheDocument();
    expect(withoutMilk).toBeInTheDocument();

    await userEvent.click(withMilk);
    expect(onSelectMilkOption).toHaveBeenCalledWith("Latte (With Milk)", 5);

    await userEvent.click(withoutMilk);
    expect(onSelectMilkOption).toHaveBeenCalledWith("Latte (No Milk)", 5);
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = jest.fn();
    render(
      <WithMilkModal
        productName="Latte"
        basePrice={5}
        onSelectMilkOption={jest.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

