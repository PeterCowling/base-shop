import { fireEvent, render, screen } from "@testing-library/react";
import GiftCardBlock from "../GiftCardBlock";

describe("GiftCardBlock", () => {
  it("renders amounts and handles purchase", () => {
    const onPurchase = jest.fn();
    render(
      <GiftCardBlock
        amounts={[25, 50]}
        description="Give a gift"
        onPurchase={onPurchase}
      />
    );
    expect(screen.getByText("Give a gift")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "$25" }));
    fireEvent.click(screen.getByRole("button", { name: "Purchase" }));
    expect(onPurchase).toHaveBeenCalledWith(25);
  });
});

