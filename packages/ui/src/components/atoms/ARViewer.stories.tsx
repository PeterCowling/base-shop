import { type Meta, type StoryObj } from "@storybook/react";
import { ARViewer } from "./ARViewer";

const meta = {
  title: "Atoms/ARViewer",
  component: ARViewer,
  args: {
    src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    className: "h-64 w-64",
  },
} satisfies Meta<typeof ARViewer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Primary = {} satisfies Story;
export const Large = {
  args: { className: "h-96 w-96" },
} satisfies Story;
