import { type Meta, type StoryObj } from "@storybook/nextjs";

import { Loader } from "./Loader";

const meta: Meta<typeof Loader> = {
  title: "Atoms/Loader",
  component: Loader,
  parameters: {
    docs: {
      description: {
        component:
          "Use the `size` prop to control dimensions in pixels and `className` to control color (`text-*`). The loader is decorative and should include `aria-hidden` if used purely visually.",
      },
    },
  },
  args: { size: 32, className: "text-primary" },
};
export default meta;

export const Primary: StoryObj<typeof Loader> = {};

export const Default: StoryObj<typeof Loader> = {};
