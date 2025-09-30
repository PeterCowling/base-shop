import { type Meta, type StoryObj } from "@storybook/react";
import CheckoutForm from "./CheckoutForm";

const meta = {
  component: CheckoutForm,
  args: {
    locale: "en",
    taxRegion: "EU",
  },
  argTypes: {
    locale: {
      control: { type: "radio" },
      options: ["en", "de", "it"],
    },
    taxRegion: { control: "text" },
  },
} satisfies Meta<typeof CheckoutForm>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
