import { type Meta, type StoryObj } from "@storybook/react";
import { StoreLocatorMap } from "./StoreLocatorMap";

const meta = {
  component: StoreLocatorMap,
  args: {
    locations: [
      { lat: 40.7128, lng: -74.006, label: "New York" },
      { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
    ],
    zoom: 4,
  },
} satisfies Meta<typeof StoreLocatorMap>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
