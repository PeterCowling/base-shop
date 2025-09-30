import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { QuantityInput } from "./QuantityInput";

const meta = {
  component: QuantityInput,
  args: {
    value: 1,
    min: 1,
    max: 5,
  },
  argTypes: {
    onChange: { action: "change" },
  },
} satisfies Meta<typeof QuantityInput>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  play: async ({ canvasElement, args }) => {
    const changeSpy = fn();
    args.onChange = changeSpy;

    const canvas = within(canvasElement);
    const decrement = await canvas.findByRole("button", { name: "-" });
    const increment = await canvas.findByRole("button", { name: "+" });

    await expect(decrement).toBeDisabled();
    await expect(increment).toBeEnabled();

    await userEvent.click(increment);

    await expect(changeSpy).toHaveBeenCalledTimes(1);
    await expect(changeSpy).toHaveBeenCalledWith(2);
  },
} satisfies Story;
