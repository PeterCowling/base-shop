import { type Meta, type StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";

import { ARViewer } from "./ARViewer";

const meta: Meta<typeof ARViewer> = {
  title: "Atoms/ARViewer",
  component: ARViewer,
  args: {
    src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    className: "h-64 w-64",
  },
};
export default meta;

export const Primary: StoryObj<typeof ARViewer> = {};
export const Large: StoryObj<typeof ARViewer> = {
  args: { className: "h-96 w-96" },
};

export const Default: StoryObj<typeof ARViewer> = {};

export const BrokenModelFallback: StoryObj<typeof ARViewer> = {
  args: {
    src: "",
  },
  parameters: { a11y: true, tags: ["visual", "ci"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewer = canvas.getByRole("img", { hidden: true });
    expect(viewer).toBeInTheDocument();
  },
};
