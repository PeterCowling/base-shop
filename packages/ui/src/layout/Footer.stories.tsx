import type { Meta, StoryObj } from "@storybook/nextjs";
import { Footer } from "../components/organisms/Footer";

const meta: Meta<typeof Footer> = {
  title: "Layout/Footer",
  component: Footer,
  tags: ["autodocs"],
  args: { children: "Footer" },
};
export default meta;

export const Default: StoryObj<typeof Footer> = {};
