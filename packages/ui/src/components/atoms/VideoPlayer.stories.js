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
};
export default meta;
export const Primary = {};
export const Autoplay = {
    args: { autoPlay: true },
};
