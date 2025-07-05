import type { Meta, StoryObj } from "@storybook/react";
import LanguageSwitcher from "./LanguageSwitcher";

const meta: Meta<typeof LanguageSwitcher> = {
  component: LanguageSwitcher,
  args: {
    current: "en",
  },
};
export default meta;

export const Default: StoryObj<typeof LanguageSwitcher> = {};
