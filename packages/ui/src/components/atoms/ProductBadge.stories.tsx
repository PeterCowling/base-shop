import { type Meta, type StoryObj } from "@storybook/react";
import { ProductBadge } from "./ProductBadge";

const meta: Meta<typeof ProductBadge> = {
  title: "Atoms/ProductBadge",
  component: ProductBadge,
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const BackCompatVariants: StoryObj<typeof ProductBadge> = {
  render: () => (
    <>
      <ProductBadge label="default" />
      <ProductBadge variant="sale" label="sale" />
      <ProductBadge variant="new" label="new" />
    </>
  ),
};

export const TonesAndColors: StoryObj<typeof ProductBadge> = {
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
};
