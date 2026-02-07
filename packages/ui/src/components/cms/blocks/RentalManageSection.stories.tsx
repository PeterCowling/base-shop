import type { Meta, StoryObj } from "@storybook/nextjs";

import RentalManageSection from "./RentalManageSection";

const meta: Meta<typeof RentalManageSection> = {
  title: "CMS Blocks/RentalManageSection",
  component: RentalManageSection,
  args: {
    rentalId: "r-1",
    adapter: async () => ({ ok: true, message: "Mocked" }),
  },
};
export default meta;

export const Default: StoryObj<typeof RentalManageSection> = {};

