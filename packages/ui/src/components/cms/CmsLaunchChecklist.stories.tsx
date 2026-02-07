import type { Meta, StoryObj } from "@storybook/nextjs";

import { CmsLaunchChecklist, type CmsLaunchStatus } from "./CmsLaunchChecklist";

const meta: Meta<typeof CmsLaunchChecklist> = {
  title: "CMS/CmsLaunchChecklist",
  component: CmsLaunchChecklist,
  args: {
    heading: "Launch checklist",
  },
};

export default meta;

type Story = StoryObj<typeof CmsLaunchChecklist>;

const baseItems: { id: string; label: string; status: CmsLaunchStatus }[] = [
  { id: "shop-basics", label: "Shop basics", status: "complete" },
  { id: "theme", label: "Look & feel", status: "complete" },
  { id: "payments", label: "Get paid", status: "error" },
  { id: "shipping-tax", label: "Shipping & tax", status: "pending" },
];

export const Default: Story = {
  args: {
    items: baseItems.map((item) => ({
      ...item,
      statusLabel:
        item.status === "complete"
          ? "Complete"
          : item.status === "error"
            ? "Needs attention"
            : item.status === "warning"
              ? "Review recommended"
              : "Pending",
      fixLabel: item.status === "complete" ? undefined : "Fix",
    })),
  },
};

export const Ready: Story = {
  args: {
    readyLabel: "All checks green — you’re ready to launch.",
    showReadyCelebration: true,
    items: baseItems.map((item) => ({
      ...item,
      status: "complete",
      statusLabel: "Complete",
      fixLabel: undefined,
    })),
  },
};

