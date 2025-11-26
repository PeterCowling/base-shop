import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { PromoCodeInput } from "./PromoCodeInput";

const meta: Meta<typeof PromoCodeInput> = {
  component: PromoCodeInput,
  args: {
    loading: false,
    onApply: fn(),
  },
};
export default meta;

export const Default: StoryObj<typeof PromoCodeInput> = {
  play: async ({ canvasElement, args }) => {
    const applySpy = args.onApply as ReturnType<typeof fn>;

    const canvas = within(canvasElement);
    const input = await canvas.findByPlaceholderText(/promo code/i);
    const submitButton = await canvas.findByRole("button", { name: /apply/i });

    await expect(submitButton).toBeDisabled();

    await userEvent.type(input, "SAVE10");
    await expect(submitButton).toBeEnabled();

    await userEvent.click(submitButton);

    await expect(applySpy).toHaveBeenCalledTimes(1);
    await expect(applySpy).toHaveBeenCalledWith("SAVE10");
  },
};
