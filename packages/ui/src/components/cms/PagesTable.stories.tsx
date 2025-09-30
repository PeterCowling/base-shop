import type { Meta, StoryObj } from "@storybook/react";
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

const meta = {
  title: "CMS/PagesTable",
  component: PagesTable,
  tags: ["autodocs"],
  args: {
    pages,
  },
} satisfies Meta<typeof PagesTable>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
