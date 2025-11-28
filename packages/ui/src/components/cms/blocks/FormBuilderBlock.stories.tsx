import type { Meta, StoryObj } from "@storybook/nextjs";
import FormBuilderBlock from "./FormBuilderBlock";

const meta: Meta<typeof FormBuilderBlock> = {
  component: FormBuilderBlock,
  args: {
    fields: [
      { type: "text", name: "name", label: "Name" },
      { type: "email", name: "email", label: "Email" },
      {
        type: "select",
        name: "color",
        label: "Color",
        options: [
          { label: "Red", value: "red" },
          { label: "Blue", value: "blue" },
        ],
      },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof FormBuilderBlock> = {};
