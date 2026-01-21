import type { Meta, StoryObj } from "@storybook/nextjs";

import LanguageSwitcher from "./LanguageSwitcher";

const meta: Meta<typeof LanguageSwitcher> = {
  title: "Molecules/LanguageSwitcher",
  component: LanguageSwitcher,
  args: {
    current: "en",
  },
};
export default meta;

export const Default: StoryObj<typeof LanguageSwitcher> = {};
