import type { Meta, StoryObj } from "@storybook/nextjs";
import { expect, fn, userEvent, within } from "storybook/test";

import { QuantityInput } from "./QuantityInput";

const meta: Meta<typeof QuantityInput> = {
  title: "Molecules/QuantityInput",
  component: QuantityInput,
  args: {
    value: 1,
    min: 1,
    max: 5,
    onChange: fn(),
  },
};
export default meta;

export const Default: StoryObj<typeof QuantityInput> = {
  play: async ({ canvasElement, args }) => {
    const changeSpy = args.onChange as ReturnType<typeof fn>;

    const canvas = within(canvasElement);
    const decrement = await canvas.findByRole("button", { name: "-" });
    const increment = await canvas.findByRole("button", { name: "+" });

    await expect(decrement).toBeDisabled();
    await expect(increment).toBeEnabled();

    await userEvent.click(increment);

    await expect(changeSpy).toHaveBeenCalledTimes(1);
    await expect(changeSpy).toHaveBeenCalledWith(2);
  },
};

export const AtMax: StoryObj<typeof QuantityInput> = {
  args: { value: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const increment = await canvas.findByRole("button", { name: "+" });
    await expect(increment).toBeDisabled();
  },
};
