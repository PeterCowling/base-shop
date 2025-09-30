import { type Meta, type StoryObj } from "@storybook/react";
import { StockStatus } from "./StockStatus";

const meta: Meta<typeof StockStatus> = {
  title: "Atoms/StockStatus",
  component: StockStatus,
};
export default meta;

export const Variants: StoryObj<typeof StockStatus> = {
  decorators: [
    (Story) => (
      <div className="flex items-center gap-4">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <StockStatus inStock />
      <StockStatus inStock={false} />
    </>
  ),
};
