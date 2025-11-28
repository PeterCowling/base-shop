import type { Meta, StoryObj } from "@storybook/nextjs";
import type { MediaItem } from "@acme/types";

import MediaFileItem from "./MediaFileItem";

const baseItem: MediaItem = {
  url: "/sample.jpg",
  type: "image",
  title: "Outdoor product image",
  altText: "Tent pitched in a forest clearing",
  tags: ["catalog", "spring"],
  size: 15234,
};

const meta: Meta<typeof MediaFileItem> = {
  component: MediaFileItem,
  args: {
    shop: "demo-shop",
    item: baseItem,
    onDelete: async () => {
      /* noop for docs */
    },
    onReplace: () => {
      /* noop for docs */
    },
    onSelect: () => {
      /* noop for docs */
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof MediaFileItem>;

export const Default: Story = {
  args: {
    selectionEnabled: false,
  },
};

export const RecentUpload: Story = {
  args: {
    item: {
      ...baseItem,
      tags: ["recent", "campaign"],
      isRecent: true,
    },
    selectionEnabled: true,
    selected: true,
  },
};

export const ReplacingInProgress: Story = {
  args: {
    item: {
      ...baseItem,
      status: "replacing",
      replaceProgress: 68,
      tags: ["catalog"],
    },
    selectionEnabled: true,
    replacing: true,
  },
};

export const Deleting: Story = {
  args: {
    deleting: true,
    selectionEnabled: true,
  },
};
