import type { Meta, StoryObj } from "@storybook/react";
import FormBuilderBlock from "./FormBuilderBlock";

const meta: Meta<typeof FormBuilderBlock> = {
  title: "CMS/Blocks/FormBuilderBlock",
  component: FormBuilderBlock,
  tags: ["autodocs"],
};

export default meta;

export const Default: StoryObj<typeof FormBuilderBlock> = {
  args: {
    action: "/api/form",
    method: "post",
    submitLabel: "Send",
    fields: [
      { type: "text", name: "name", label: "Name", placeholder: "Your name" },
      { type: "email", name: "email", label: "Email", placeholder: "you@example.com" },
      {
        type: "select",
        name: "color",
        label: "Favorite color",
        options: [
          { label: "Red", value: "red" },
          { label: "Blue", value: "blue" },
        ],
      },
    ],
  },
};
