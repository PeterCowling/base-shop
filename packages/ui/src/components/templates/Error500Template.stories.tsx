import { type Meta, type StoryObj } from "@storybook/nextjs";

import { Error500Template } from "./Error500Template";

const meta: Meta<typeof Error500Template> = {
  title: "Templates/Error500Template",
  component: Error500Template,
  args: {
    homeHref: "/",
  },
};
export default meta;

type Story = StoryObj<typeof Error500Template>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { homeHref: "" },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
