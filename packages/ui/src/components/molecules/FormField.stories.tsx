import type { Meta, StoryObj } from "@storybook/nextjs";
import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  component: FormField,
  args: {
    label: "Name",
    htmlFor: "name",
    required: false,
    error: "",
  },
};
export default meta;

export const Default: StoryObj<typeof FormField> = {
  render: (args) => (
    <FormField {...args}>
      <input id={args.htmlFor} />
    </FormField>
  ),
};
