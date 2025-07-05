import { type Meta, type StoryObj } from "@storybook/react";
import { Tag } from "./Tag";

const meta: Meta<typeof Tag> = {
  title: "Atoms/Tag",
  component: Tag,
};
export default meta;

export const Variants: StoryObj<typeof Tag> = {
  render: () => (
    <div className="flex gap-2">
      <Tag>Default</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="destructive">Destructive</Tag>
    </div>
  ),
};
