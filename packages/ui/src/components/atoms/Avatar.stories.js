import { Avatar } from "./Avatar";
const meta = {
    title: "Atoms/Avatar",
    component: Avatar,
    args: {
        src: "https://placekitten.com/200/200",
        alt: "Kitten",
        size: 32,
    },
};
export default meta;
export const Size32 = {};
export const Size48 = {
    args: { size: 48 },
};
export const Size64 = {
    args: { size: 64 },
};
