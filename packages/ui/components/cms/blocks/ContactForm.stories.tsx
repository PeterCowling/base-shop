import type { Meta, StoryObj } from "@storybook/react";
import ContactForm from "./ContactForm";

const meta: Meta<typeof ContactForm> = {
  component: ContactForm,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof ContactForm> = {};
