import type { Meta, StoryObj } from "@storybook/nextjs";

import ContactForm from "./ContactForm";

const meta: Meta<typeof ContactForm> = {
  title: "CMS Blocks/ContactForm",
  component: ContactForm,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof ContactForm> = {};
