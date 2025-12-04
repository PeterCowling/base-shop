import type { Meta, StoryObj } from "@storybook/react";
import { BlogPortableText } from "./index";

const meta: Meta<typeof BlogPortableText> = {
  title: "Platform/Blog/BlogPortableText",
  component: BlogPortableText,
  args: {
    value: [
      { _type: "block", children: [{ _type: "span", text: "Portable text sample" }] },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Featured products" }],
      },
      {
        _type: "productReference",
        ids: ["green-sneaker"],
      },
      {
        _type: "embed",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof BlogPortableText>;

export const Default: Story = {};
