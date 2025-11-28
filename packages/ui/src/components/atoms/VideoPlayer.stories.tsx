import { type Meta, type StoryObj } from "@storybook/nextjs";
import { VideoPlayer } from "./VideoPlayer";

const meta: Meta<typeof VideoPlayer> = {
  title: "Atoms/VideoPlayer",
  component: VideoPlayer,
  argTypes: { autoPlay: { control: "boolean" } },
  args: {
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    autoPlay: false,
    className: "w-64",
  },
};
export default meta;

export const Primary: StoryObj<typeof VideoPlayer> = {};
export const Autoplay: StoryObj<typeof VideoPlayer> = {
  args: { autoPlay: true },
};
