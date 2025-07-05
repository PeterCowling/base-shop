import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from "../atoms-shadcn";
import { WishlistDrawer } from "./WishlistDrawer";
const items = [
    {
        id: "1",
        title: "Item One",
        image: "https://placehold.co/64",
        price: 10,
    },
];
const meta = {
    component: WishlistDrawer,
    args: {
        trigger: _jsx(Button, { children: "Open wishlist" }),
        items,
    },
};
export default meta;
export const Default = {};
