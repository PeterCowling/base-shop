import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./FormField";

const meta = {
  component: FormField,
  args: {
    label: "Name",
    htmlFor: "name",
    required: false,
    error: "",
  },
} satisfies Meta<typeof FormField>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  render: (args) => (
    <FormField {...args}>
      <input id={args.htmlFor} />
    </FormField>
  ),
} satisfies Story;
