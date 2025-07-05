import { ZoomImage } from "./ZoomImage";
const meta = {
    title: "Atoms/ZoomImage",
    component: ZoomImage,
    args: {
        src: "https://picsum.photos/800/600",
        alt: "Sample",
        width: 400,
        height: 300,
    },
};
export default meta;
export const ClickZoom = {};
export const HoverZoom = {
    args: { className: "hover:scale-125" },
};
