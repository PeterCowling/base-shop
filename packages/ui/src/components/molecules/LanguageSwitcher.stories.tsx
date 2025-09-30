import type { Meta, StoryObj } from "@storybook/react";
import LanguageSwitcher from "./LanguageSwitcher";

const meta = {
  component: LanguageSwitcher,
  args: {
    current: "en",
  },
} satisfies Meta<typeof LanguageSwitcher>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
