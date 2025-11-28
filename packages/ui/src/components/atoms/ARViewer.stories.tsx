import { type Meta, type StoryObj } from "@storybook/nextjs";
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
