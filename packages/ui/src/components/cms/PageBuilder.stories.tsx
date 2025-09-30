import type { Meta, StoryObj } from "@storybook/react";
import type { Page } from "@acme/types";
import PageBuilder from "./page-builder/PageBuilder";

const samplePage: Page = {
  id: "1",
  slug: "sample",
  status: "draft",
  components: [],
  seo: {
    title: {
      en: "Sample",
      de: "Sample",
      it: "Sample",
    },
  },
  createdAt: "",
  updatedAt: "",
  createdBy: "",
};

const meta = {
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
} satisfies Meta<typeof PageBuilder>;
export default meta;

type Story = StoryObj<typeof meta>;


export const GroupedPalette = {} satisfies Story;
