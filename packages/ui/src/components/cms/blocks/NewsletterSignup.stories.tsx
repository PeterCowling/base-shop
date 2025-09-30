import type { Meta, StoryObj } from "@storybook/react";
import NewsletterSignup from "./NewsletterSignup";

const meta = {
  title: "CMS/Blocks/NewsletterSignup",
  component: NewsletterSignup,
  tags: ["autodocs"],
} satisfies Meta<typeof NewsletterSignup>;

export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  args: {
    text: "Join our mailing list",
    action: "/api/subscribe",
    placeholder: "Email address",
    submitLabel: "Sign Up",
  },
} satisfies Story;
