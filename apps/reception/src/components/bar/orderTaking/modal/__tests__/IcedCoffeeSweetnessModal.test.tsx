import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import IcedCoffeeSweetnessModal from "../IcedCoffeeSweetnessModal";

describe("IcedCoffeeSweetnessModal", () => {
  it("renders options and selects Sweetened or Unsweetened", async () => {
    const onSelectSweetness = jest.fn();
    render(
      <IcedCoffeeSweetnessModal
        productName="Iced Coffee"
        basePrice={4}
        onSelectSweetness={onSelectSweetness}
        onCancel={jest.fn()}
      />
    );

    // buttons rendered
    const sweetenedBtn = screen.getByRole("button", { name: /^Sweetened$/i });
    const unsweetenedBtn = screen.getByRole("button", { name: /^Unsweetened$/i });
    expect(sweetenedBtn).toBeInTheDocument();
    expect(unsweetenedBtn).toBeInTheDocument();

    await userEvent.click(sweetenedBtn);
    expect(onSelectSweetness).toHaveBeenCalledWith("Iced Coffee (Sweetened)", 4);

    await userEvent.click(unsweetenedBtn);
    expect(onSelectSweetness).toHaveBeenCalledWith("Iced Coffee (Unsweetened)", 4);
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = jest.fn();
    render(
      <IcedCoffeeSweetnessModal
        productName="Iced Coffee"
        basePrice={4}
        onSelectSweetness={jest.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

