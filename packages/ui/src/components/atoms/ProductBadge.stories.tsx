import { type Meta, type StoryObj } from "@storybook/react";
import { ProductBadge } from "./ProductBadge";

const meta = {
  title: "Atoms/ProductBadge",
  component: ProductBadge,
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductBadge>;
export default meta;

type Story = StoryObj<typeof meta>;


export const BackCompatVariants = {
  render: () => (
    <>
      <ProductBadge label="default" />
      <ProductBadge variant="sale" label="sale" />
      <ProductBadge variant="new" label="new" />
    </>
  ),
} satisfies Story;

export const TonesAndColors = {
  render: () => (
    <>
      <ProductBadge color="success" tone="soft" label="success soft" />
      <ProductBadge color="success" tone="solid" label="success solid" />
      <ProductBadge color="danger" tone="soft" label="danger soft" />
      <ProductBadge color="danger" tone="solid" label="danger solid" />
      <ProductBadge color="primary" tone="soft" label="primary soft" />
      <ProductBadge color="primary" tone="solid" label="primary solid" />
      <ProductBadge color="accent" tone="soft" label="accent soft" />
      <ProductBadge color="accent" tone="solid" label="accent solid" />
    </>
  ),
} satisfies Story;
