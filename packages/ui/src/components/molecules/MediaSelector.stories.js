import { MediaSelector } from "./MediaSelector";
const meta = {
    component: MediaSelector,
    args: {
        items: [
            { type: "image", src: "/hero/slide-1.jpg" },
            { type: "image", src: "/hero/slide-2.jpg" },
            { type: "image", src: "/hero/slide-3.jpg" },
        ],
        active: 0,
    },
    argTypes: {
        onChange: { action: "change" },
    },
};
export default meta;
export const Default = {};
