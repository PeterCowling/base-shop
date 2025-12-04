import type { Meta, StoryObj } from "@storybook/nextjs";
import CollectionList from "./CollectionList";

const collections = [
  { id: "1", title: "Collection 1", image: "/placeholder.svg" },
  { id: "2", title: "Collection 2", image: "/placeholder.svg" },
  { id: "3", title: "Collection 3", image: "/placeholder.svg" },
  { id: "4", title: "Collection 4", image: "/placeholder.svg" },
];

const meta: Meta<typeof CollectionList> = {
  title: "CMS Blocks/CollectionList",
  component: CollectionList,
  args: { collections },
};
export default meta;

export const Default: StoryObj<typeof CollectionList> = {};

export const Bounded: StoryObj<typeof CollectionList> = {
  args: { minItems: 2, maxItems: 3 },
};
