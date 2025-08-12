import type { Meta, StoryObj } from "@storybook/react";
import NewsletterSignup from "./NewsletterSignup";

const meta: Meta<typeof NewsletterSignup> = {
  component: NewsletterSignup,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof NewsletterSignup> = {};
