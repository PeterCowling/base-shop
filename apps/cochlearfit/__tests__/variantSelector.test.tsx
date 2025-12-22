import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VariantSelector from "@/components/VariantSelector";
import { renderWithProviders } from "./testUtils";

describe("VariantSelector", () => {
  it("fires callbacks when selecting size and color", async () => {
    const user = userEvent.setup();
    const onSizeChange = jest.fn();
    const onColorChange = jest.fn();

    renderWithProviders(
      <VariantSelector
        sizes={["kids", "adult"]}
        colors={["sand", "ocean"]}
        size="kids"
        color="sand"
        onSizeChange={onSizeChange}
        onColorChange={onColorChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Adult" }));
    await user.click(screen.getByRole("button", { name: "Ocean" }));

    expect(onSizeChange).toHaveBeenCalledWith("adult");
    expect(onColorChange).toHaveBeenCalledWith("ocean");
  });
});
