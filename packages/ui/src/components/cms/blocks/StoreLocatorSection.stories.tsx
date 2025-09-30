import type { Meta, StoryObj } from "@storybook/react";
import StoreLocatorSection from "./StoreLocatorSection";

const meta = {
  component: StoreLocatorSection,
  args: {
    enableGeolocation: false,
    stores: [
      { id: "a", label: "ACME Central", lat: 37.7749, lng: -122.4194, address: "123 Market St" },
      { id: "b", label: "ACME Mission", lat: 37.7599, lng: -122.4148, address: "456 Valencia St" },
    ],
  },
} satisfies Meta<typeof StoreLocatorSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

