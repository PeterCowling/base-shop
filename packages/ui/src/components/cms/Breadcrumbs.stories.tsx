import type { Meta, StoryObj } from "@storybook/react";
import Breadcrumbs from "./Breadcrumbs.client";

const meta = {
  component: Breadcrumbs,
  args: {},
} satisfies Meta<typeof Breadcrumbs>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
