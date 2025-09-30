import { type Meta, type StoryObj } from "@storybook/react";
import { StoreLocatorTemplate } from "./StoreLocatorTemplate";

const meta = {
  component: StoreLocatorTemplate,
  args: {
    stores: [
      { id: "1", name: "Downtown", address: "123 Main St", lat: 0, lng: 0 },
      { id: "2", name: "Uptown", address: "456 Second St", lat: 0, lng: 0 },
    ],
  },
} satisfies Meta<typeof StoreLocatorTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
