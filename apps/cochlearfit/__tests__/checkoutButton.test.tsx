import { screen } from "@testing-library/react";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import { renderWithProviders } from "./testUtils";

const noop = () => undefined;

describe("CheckoutButton", () => {
  it("disables when loading or disabled", () => {
    renderWithProviders(
      <CheckoutButton
        onClick={noop}
        disabled
        isLoading={false}
        label="Pay"
        loadingLabel="Loading"
      />
    );

    const button = screen.getByRole("button", { name: "Pay" });
    expect(button).toBeDisabled();
  });

  it("disables when loading", () => {
    renderWithProviders(
      <CheckoutButton
        onClick={noop}
        disabled={false}
        isLoading
        label="Pay"
        loadingLabel="Loading"
      />
    );

    const button = screen.getByRole("button", { name: "Loading" });
    expect(button).toBeDisabled();
  });
});
