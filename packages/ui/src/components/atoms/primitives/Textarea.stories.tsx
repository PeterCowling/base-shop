import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "Atoms/Primitives/Textarea",
  component: Textarea,
  args: {
    placeholder: "Enter detailed notes",
    rows: 4,
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithLongUnbroken: Story = {
  args: {
    defaultValue:
      "supercalifragilisticexpialidocioussupercalifragilisticexpialidociouswithoutspaces",
  },
};
