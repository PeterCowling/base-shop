import type { Meta, StoryObj } from "@storybook/react";
import type { MediaItem } from "@acme/types";
import { ImageGallery } from "./index";

const mediaItems: MediaItem[] = [
  {
    url: "https://placehold.co/800x800/png",
    type: "image",
    title: "Primary",
    altText: "Primary image",
  },
  {
    url: "https://placehold.co/800x800/jpg",
    type: "image",
    title: "Secondary",
    altText: "Secondary image",
  },
  {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    type: "video",
    title: "Video",
    altText: "Video fallback",
  },
];

const meta: Meta<typeof ImageGallery> = {
  title: "Platform/PDP/ImageGallery",
  component: ImageGallery,
  args: {
    items: mediaItems,
  },
};

export default meta;
type Story = StoryObj<typeof ImageGallery>;

export const Default: Story = {};
