import { type Meta, type StoryObj } from "@storybook/react";
import { Loader } from "./Loader";

const meta: Meta<typeof Loader> = {
  title: "Atoms/Loader",
  component: Loader,
  parameters: {
    docs: {
      description: {
        component:
          "Use `className` to control size (`h-* w-*`) and color (`text-*`). The loader is decorative and should include `aria-hidden` if used purely visually.",
      },
    },
  },
  args: { className: "h-8 w-8 text-blue-500" },
};
export default meta;

export const Primary: StoryObj<typeof Loader> = {};
