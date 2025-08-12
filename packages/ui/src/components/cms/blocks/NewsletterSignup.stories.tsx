import type { Meta, StoryObj } from "@storybook/react";
import NewsletterSignup from "./NewsletterSignup";

const meta: Meta<typeof NewsletterSignup> = {
  title: "CMS/Blocks/NewsletterSignup",
  component: NewsletterSignup,
  tags: ["autodocs"],
};

export default meta;

export const Default: StoryObj<typeof NewsletterSignup> = {
  args: {
    text: "Join our mailing list",
    action: "/api/subscribe",
    placeholder: "Email address",
    submitLabel: "Sign Up",
  },
};
