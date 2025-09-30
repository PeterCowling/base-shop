import { type Meta, type StoryObj } from "@storybook/react";
import { StockStatus } from "./StockStatus";

const meta = {
  title: "Atoms/StockStatus",
  component: StockStatus,
} satisfies Meta<typeof StockStatus>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Variants = {
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
} satisfies Story;
