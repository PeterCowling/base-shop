import type { Meta, StoryObj } from "@storybook/nextjs";

import StoreLocatorBlock from "./StoreLocatorBlock";

const meta: Meta<typeof StoreLocatorBlock> = {
  title: "CMS Blocks/StoreLocatorBlock",
  component: StoreLocatorBlock,
  args: {
    locations: [
      { lat: 40.7128, lng: -74.006, label: "New York" },
      { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
    ],
    zoom: 4,
  },
};
export default meta;

export const Default: StoryObj<typeof StoreLocatorBlock> = {};
