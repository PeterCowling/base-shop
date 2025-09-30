import type { Meta, StoryObj } from "@storybook/react";
import RentalManageSection from "./RentalManageSection";

const meta = {
  component: RentalManageSection,
  args: {
    rentalId: "r-1",
    adapter: async () => ({ ok: true, message: "Mocked" }),
  },
} satisfies Meta<typeof RentalManageSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

