import { type Meta, type StoryObj } from "@storybook/react";
import CheckoutForm from "./CheckoutForm";

const meta: Meta<typeof CheckoutForm> = {
  component: CheckoutForm,
  args: {
    locale: "en",
  },
  argTypes: {
    locale: {
      control: { type: "radio" },
      options: ["en", "de", "it"],
    },
  },
};
export default meta;

export const Default: StoryObj<typeof CheckoutForm> = {};
