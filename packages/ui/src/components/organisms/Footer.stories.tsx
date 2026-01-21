import { type Meta, type StoryObj } from "@storybook/nextjs";

import { Footer } from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Organisms/Footer",
  component: Footer,
  args: {
    children: "Footer content",
    shopName: "My Shop",
  },
};
export default meta;

export const Default: StoryObj<typeof Footer> = {};
