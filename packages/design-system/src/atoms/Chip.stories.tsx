import { type Meta, type StoryObj } from "@storybook/nextjs";

import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "Atoms/Chip",
  component: Chip,
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const BackCompatVariants: StoryObj<typeof Chip> = {
  render: () => (
    <>
      <Chip size="sm">default sm</Chip>
      <Chip size="md">default md</Chip>
      <Chip size="lg">default lg</Chip>
      <Chip variant="success">success</Chip>
      <Chip variant="warning">warning</Chip>
      <Chip variant="destructive">destructive</Chip>
    </>
  ),
};

export const TonesAndColors: StoryObj<typeof Chip> = {
  render: () => (
    <>
      <Chip color="primary" tone="soft">primary soft</Chip>
      <Chip color="primary" tone="solid">primary solid</Chip>
      <Chip color="primary" tone="quiet">primary quiet</Chip>
      <Chip color="success" tone="soft">success soft</Chip>
      <Chip color="success" tone="solid">success solid</Chip>
      <Chip color="success" tone="quiet">success quiet</Chip>
      <Chip color="warning" tone="soft">warning soft</Chip>
      <Chip color="warning" tone="solid">warning solid</Chip>
      <Chip color="warning" tone="quiet">warning quiet</Chip>
      <Chip color="danger" tone="soft">danger soft</Chip>
      <Chip color="danger" tone="solid">danger solid</Chip>
      <Chip color="danger" tone="quiet">danger quiet</Chip>
    </>
  ),
};

export const SizesAndActions: StoryObj<typeof Chip> = {
  render: () => (
    <>
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
      <Chip size="md" onRemove={() => {}}>Closable</Chip>
      <Chip size="lg" color="accent" tone="solid" onRemove={() => {}}>
        Accent removable
      </Chip>
    </>
  ),
};

export const Default: StoryObj<typeof Chip> = {};
