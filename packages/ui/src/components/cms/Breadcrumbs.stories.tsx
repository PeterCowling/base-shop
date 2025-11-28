import type { Meta, StoryObj } from "@storybook/nextjs";
import Breadcrumbs from "./Breadcrumbs.client";

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof Breadcrumbs> = {};
