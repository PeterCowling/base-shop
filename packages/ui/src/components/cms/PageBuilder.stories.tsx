import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
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

const meta: Meta<typeof PageBuilder> = {
  component: PageBuilder,
  args: {
    page: samplePage,
    onSave: fn(async () => {}),
    onPublish: fn(async () => {}),
  },
};
export default meta;

export const GroupedPalette: StoryObj<typeof PageBuilder> = {};
