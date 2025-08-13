import type { Meta, StoryObj } from "@storybook/react";
import FormBuilderBlock from "./FormBuilderBlock";

const meta: Meta<typeof FormBuilderBlock> = {
  title: "CMS/Blocks/FormBuilder",
  component: FormBuilderBlock,
  tags: ["autodocs"],
};

export default meta;

export const Default: StoryObj<typeof FormBuilderBlock> = {
  args: {
    fields: [
      { type: "text", name: "name", label: "Name" },
      { type: "email", name: "email", label: "Email" },
      {
        type: "select",
        name: "color",
        label: "Favorite Color",
        options: [
          { label: "Red", value: "red" },
          { label: "Blue", value: "blue" },
        ],
      },
    ],
  },
};

