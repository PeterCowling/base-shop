import type { Meta, StoryObj } from "@storybook/react";
import FormBuilderBlock from "./FormBuilderBlock";

const meta = {
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
} satisfies Meta<typeof FormBuilderBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
