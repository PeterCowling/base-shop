import type { Meta, StoryObj } from "@storybook/react";
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

const meta = {
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
} satisfies Meta<typeof MediaFileItem>;

export default meta;

type Story = StoryObj<typeof meta>;



export const Default = {
  args: {
    selectionEnabled: false,
  },
} satisfies Story;

export const RecentUpload = {
  args: {
    item: {
      ...baseItem,
      tags: ["recent", "campaign"],
      isRecent: true,
    },
    selectionEnabled: true,
    selected: true,
  },
} satisfies Story;

export const ReplacingInProgress = {
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
} satisfies Story;

export const Deleting = {
  args: {
    deleting: true,
    selectionEnabled: true,
  },
} satisfies Story;
