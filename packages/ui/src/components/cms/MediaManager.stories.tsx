import type { Meta, StoryObj } from "@storybook/react";
import type { MediaItem } from "@acme/types";
import MediaManager from "./MediaManager";

const files: MediaItem[] = [
  { url: "/sample.jpg", altText: "Sample", tags: ["demo"], type: "image" },
];

const meta = {
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
} satisfies Meta<typeof MediaManager>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
