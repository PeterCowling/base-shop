import type { Meta, StoryObj } from "@storybook/react";
import type { MediaItem } from "@acme/types";
import MediaManager from "./MediaManager";

const files: MediaItem[] = [
  { url: "/sample.jpg", altText: "Sample", tags: ["demo"], type: "image" },
];

const meta: Meta<typeof MediaManager> = {
  component: MediaManager,
  args: {
    shop: "demo",
    initialFiles: files,
    onDelete: () => alert("delete"),
    onUpdateMetadata: async (_shop, _url, updates) => ({
      url: "/sample.jpg",
      type: "image",
      ...updates,
    }),
  },
  argTypes: {
    shop: { control: "text" },
    initialFiles: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof MediaManager> = {};
