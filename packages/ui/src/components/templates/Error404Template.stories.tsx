import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Error404Template } from "./Error404Template";

const meta: Meta<typeof Error404Template> = {
  title: "Templates/Error404Template",
  component: Error404Template,
  args: {
    homeHref: "/",
  },
};
export default meta;

type Story = StoryObj<typeof Error404Template>;
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
