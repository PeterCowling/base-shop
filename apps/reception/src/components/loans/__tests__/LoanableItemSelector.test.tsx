import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoanableItemSelector } from "../LoanableItemSelector";

const guest = {
  guestId: "g1",
  bookingRef: "b1",
  firstName: "Alice",
  lastName: "Smith",
};

describe("LoanableItemSelector", () => {
  it("selects items and opens modal", async () => {
    const onSelectItem = jest.fn();
    const openModal = jest.fn();
    const { rerender } = render(
      <LoanableItemSelector
        guest={guest}
        guestSelectedItem="Umbrella"
        buttonDisabled={false}
        onSelectItem={onSelectItem}
        openModal={openModal}
      />
    );

    await userEvent.selectOptions(screen.getByRole("combobox"), "Hairdryer");
    expect(onSelectItem).toHaveBeenCalledWith("Hairdryer");

    rerender(
      <LoanableItemSelector
        guest={guest}
        guestSelectedItem="Hairdryer"
        buttonDisabled={false}
        onSelectItem={onSelectItem}
        openModal={openModal}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /loan/i }));
    expect(openModal).toHaveBeenCalledWith("loan", guest, "Hairdryer");
  });

  it("disables the loan button", async () => {
    const openModal = jest.fn();
    render(
      <LoanableItemSelector
        guest={guest}
        guestSelectedItem="Umbrella"
        buttonDisabled={true}
        onSelectItem={jest.fn()}
        openModal={openModal}
      />
    );

    const button = screen.getByRole("button", { name: /loan/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(openModal).not.toHaveBeenCalled();
  });
});

