import type { Meta, StoryObj } from "@storybook/nextjs";

import type { Page } from "@acme/types";

import PagesTable from "./PagesTable";

const pages: Page[] = [
  {
    id: "1",
    slug: "home",
    status: "draft",
    components: [],
    seo: {
      title: {
        en: "Home",
        de: "Home",
        it: "Home",
      },
    },
    createdAt: "2023-01-01",
    updatedAt: "2023-01-01",
    createdBy: "admin",
  },
];

const meta: Meta<typeof PagesTable> = {
  title: "CMS/PagesTable",
  component: PagesTable,
  tags: ["autodocs"],
  args: {
    pages,
  },
};
export default meta;

export const Default: StoryObj<typeof PagesTable> = {};
