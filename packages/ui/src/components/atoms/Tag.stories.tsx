import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Tag } from "./Tag";

const meta: Meta<typeof Tag> = {
  title: "Atoms/Tag",
  component: Tag,
};
export default meta;

export const Variants: StoryObj<typeof Tag> = {
  decorators: [
    (Story) => (
      <div className="flex flex-wrap gap-2 items-center">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Tag size="sm">Default sm</Tag>
      <Tag size="md">Default md</Tag>
      <Tag size="lg">Default lg</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="destructive">Destructive</Tag>
    </>
  ),
};

export const TonesAndColors: StoryObj<typeof Tag> = {
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
      <Tag color="primary" tone="quiet">primary quiet</Tag>
      <Tag color="accent" tone="quiet">accent quiet</Tag>
      <Tag color="info" tone="quiet">info quiet</Tag>
      <Tag color="danger" tone="quiet">danger quiet</Tag>
    </>
  ),
};

export const SizesAndTones: StoryObj<typeof Tag> = {
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-3">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tag size="sm" color="primary" tone="soft">primary sm</Tag>
        <Tag size="md" color="primary" tone="soft">primary md</Tag>
        <Tag size="lg" color="primary" tone="soft">primary lg</Tag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag size="sm" color="accent" tone="solid">accent sm</Tag>
        <Tag size="md" color="accent" tone="solid">accent md</Tag>
        <Tag size="lg" color="accent" tone="solid">accent lg</Tag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag size="sm" color="danger" tone="soft">danger sm</Tag>
        <Tag size="md" color="danger" tone="solid">danger md</Tag>
        <Tag size="lg" color="danger" tone="solid">danger lg</Tag>
      </div>
    </>
  ),
};

export const Default: StoryObj<typeof Tag> = {};
