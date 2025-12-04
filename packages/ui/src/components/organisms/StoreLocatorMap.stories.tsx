import { type Meta, type StoryObj } from "@storybook/nextjs";
import { StoreLocatorMap } from "./StoreLocatorMap";

const meta: Meta<typeof StoreLocatorMap> = {
  title: "Organisms/StoreLocatorMap",
  component: StoreLocatorMap,
  args: {
    locations: [
      { lat: 40.7128, lng: -74.006, label: "New York" },
      { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
    ],
    zoom: 4,
  },
};
export default meta;

export const Default: StoryObj<typeof StoreLocatorMap> = {};
