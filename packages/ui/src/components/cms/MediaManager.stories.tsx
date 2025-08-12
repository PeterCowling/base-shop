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
  },
  argTypes: {
    shop: { control: "text" },
    initialFiles: { control: "object" },
  },
};
export default meta;

export const Default: StoryObj<typeof MediaManager> = {};
