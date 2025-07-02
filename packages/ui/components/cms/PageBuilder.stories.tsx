import type { Meta, StoryObj } from "@storybook/react";
import type { Page } from "@types";
import PageBuilder from "./PageBuilder";

const samplePage: Page = {
  id: "1",
  slug: "sample",
  status: "draft",
  components: [],
  seo: { title: "Sample" },
  createdAt: "",
  updatedAt: "",
  createdBy: "",
};

const meta: Meta<typeof PageBuilder> = {
  component: PageBuilder,
  args: {
    page: samplePage,
    onSave: async () => {},
    onPublish: async () => {},
  },
  argTypes: {
    onSave: { action: "save" },
    onPublish: { action: "publish" },
  },
};
export default meta;

export const GroupedPalette: StoryObj<typeof PageBuilder> = {};
