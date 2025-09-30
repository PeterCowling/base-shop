import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { PromoCodeInput } from "./PromoCodeInput";

const meta = {
  component: PromoCodeInput,
  args: {
    loading: false,
  },
  argTypes: {
    onApply: { action: "apply" },
  },
} satisfies Meta<typeof PromoCodeInput>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  play: async ({ canvasElement, args }) => {
    const applySpy = fn();
    args.onApply = applySpy;

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
} satisfies Story;
