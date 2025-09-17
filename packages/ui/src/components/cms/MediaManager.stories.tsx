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
    onMetadataUpdate: async (_shop, url, fields) => ({
      url,
      type: "image",
      ...fields,
    }),
  },
  argTypes: {
    shop: { control: "text" },
    initialFiles: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof MediaManager> = {};
