import { type Meta, type StoryObj } from "@storybook/react";
import { VideoPlayer } from "./VideoPlayer";

const meta = {
  title: "Atoms/VideoPlayer",
  component: VideoPlayer,
  argTypes: { autoPlay: { control: "boolean" } },
  args: {
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    autoPlay: false,
    className: "w-64",
  },
} satisfies Meta<typeof VideoPlayer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Primary = {} satisfies Story;
export const Autoplay = {
  args: { autoPlay: true },
} satisfies Story;
