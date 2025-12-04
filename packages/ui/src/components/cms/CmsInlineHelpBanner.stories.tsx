import type { Meta, StoryObj } from "@storybook/nextjs";
import { CmsInlineHelpBanner } from "./CmsInlineHelpBanner";

const meta: Meta<typeof CmsInlineHelpBanner> = {
  title: "CMS/CmsInlineHelpBanner",
  component: CmsInlineHelpBanner,
};

export default meta;

type Story = StoryObj<typeof CmsInlineHelpBanner>;

export const Info: Story = {
  args: {
    heading: "Need a hand configuring your shop?",
    body: "Open the build guide in a new tab to follow the launch‑in‑under‑an‑hour path.",
    links: [
      {
        id: "build-guide",
        label: "Open build guide",
        href: "/docs/cms/build-shop-guide.md",
      },
    ],
  },
};

export const Warning: Story = {
  args: {
    heading: "Additional pages are optional for launch",
    body: "Use starter kits to add About/Contact pages now, or come back after you’re live.",
    tone: "warning",
    links: [
      {
        id: "starter-kits",
        label: "View starter kits",
        href: "/docs/cms/build-shop-guide.md#starter-kits",
      },
    ],
  },
};

