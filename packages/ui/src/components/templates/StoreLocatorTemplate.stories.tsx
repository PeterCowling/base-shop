import { type Meta, type StoryObj } from "@storybook/nextjs";
import { StoreLocatorTemplate } from "./StoreLocatorTemplate";

const meta: Meta<typeof StoreLocatorTemplate> = {
  title: "Templates/StoreLocatorTemplate",
  component: StoreLocatorTemplate,
  args: {
    stores: [
      { id: "1", name: "Downtown", address: "123 Main St", lat: 0, lng: 0 },
      { id: "2", name: "Uptown", address: "456 Second St", lat: 0, lng: 0 },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof StoreLocatorTemplate> = {};
