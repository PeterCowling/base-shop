import { type Meta, type StoryObj } from "@storybook/react";
import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Layout/FooterComponent",
  component: Footer,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof Footer> = {};
