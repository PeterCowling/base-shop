import { type Meta, type StoryObj } from "@storybook/nextjs";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = {
  title: "Atoms/IconButton",
  component: IconButton,
  decorators: [
    (Story) => (
      <div className="flex items-center gap-3">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Variants: StoryObj<typeof IconButton> = {
  render: () => (
    <>
      <IconButton variant="primary" aria-label="primary">
        ★
      </IconButton>
      <IconButton variant="secondary" aria-label="secondary">
        ★
      </IconButton>
      <IconButton variant="ghost" aria-label="ghost">
        ★
      </IconButton>
      <IconButton variant="danger" aria-label="danger">
        ★
      </IconButton>
      <IconButton variant="quiet" aria-label="quiet">
        ★
      </IconButton>
    </>
  ),
};

export const Sizes: StoryObj<typeof IconButton> = {
  render: () => (
    <>
      <IconButton size="sm" variant="primary" aria-label="small">
        •
      </IconButton>
      <IconButton size="md" variant="primary" aria-label="medium">
        •
      </IconButton>
    </>
  ),
};

export const Default: StoryObj<typeof IconButton> = {};
