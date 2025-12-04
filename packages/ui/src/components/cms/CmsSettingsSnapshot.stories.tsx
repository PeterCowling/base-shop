import type { Meta, StoryObj } from "@storybook/nextjs";
import { CmsSettingsSnapshot } from "./CmsSettingsSnapshot";

const meta: Meta<typeof CmsSettingsSnapshot> = {
  title: "CMS/CmsSettingsSnapshot",
  component: CmsSettingsSnapshot,
};

export default meta;

type Story = StoryObj<typeof CmsSettingsSnapshot>;

export const Default: Story = {
  args: {
    title: "Current snapshot",
    body: "A quick overview of the core settings that affect launch readiness.",
    rows: [
      { id: "languages", label: "Languages", value: "en, it" },
      { id: "currency", label: "Currency", value: "EUR", tone: "success" },
      { id: "tax-region", label: "Tax region", value: "EU", tone: "success" },
      { id: "theme", label: "Theme preset", value: "Evergreen" },
    ],
  },
};

