import { type Meta, type StoryObj } from "@storybook/react";
import { Tag } from "./Tag";

const meta = {
  title: "Atoms/Tag",
  component: Tag,
} satisfies Meta<typeof Tag>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Variants = {
  decorators: [
    (Story) => (
      <div className="flex gap-2">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Tag>Default</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="destructive">Destructive</Tag>
    </>
  ),
} satisfies Story;

export const TonesAndColors = {
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Tag color="primary" tone="soft">primary soft</Tag>
      <Tag color="primary" tone="solid">primary solid</Tag>
      <Tag color="accent" tone="soft">accent soft</Tag>
      <Tag color="accent" tone="solid">accent solid</Tag>
      <Tag color="success" tone="soft">success soft</Tag>
      <Tag color="success" tone="solid">success solid</Tag>
      <Tag color="info" tone="soft">info soft</Tag>
      <Tag color="info" tone="solid">info solid</Tag>
      <Tag color="warning" tone="soft">warning soft</Tag>
      <Tag color="warning" tone="solid">warning solid</Tag>
      <Tag color="danger" tone="soft">danger soft</Tag>
      <Tag color="danger" tone="solid">danger solid</Tag>
    </>
  ),
} satisfies Story;
