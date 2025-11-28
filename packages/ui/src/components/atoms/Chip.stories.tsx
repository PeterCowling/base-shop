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
      <Chip>default</Chip>
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
      <Chip color="success" tone="soft">success soft</Chip>
      <Chip color="success" tone="solid">success solid</Chip>
      <Chip color="warning" tone="soft">warning soft</Chip>
      <Chip color="warning" tone="solid">warning solid</Chip>
      <Chip color="danger" tone="soft">danger soft</Chip>
      <Chip color="danger" tone="solid">danger solid</Chip>
    </>
  ),
};
