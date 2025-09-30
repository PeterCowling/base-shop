import type { Meta, StoryObj } from "@storybook/react";
import CollectionList from "./CollectionList";

const collections = [
  { id: "1", title: "Collection 1", image: "/placeholder.svg" },
  { id: "2", title: "Collection 2", image: "/placeholder.svg" },
  { id: "3", title: "Collection 3", image: "/placeholder.svg" },
  { id: "4", title: "Collection 4", image: "/placeholder.svg" },
];

const meta = {
  component: CollectionList,
  args: { collections },
} satisfies Meta<typeof CollectionList>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const Bounded = {
  args: { minItems: 2, maxItems: 3 },
} satisfies Story;
