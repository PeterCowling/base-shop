import { WishlistTemplate } from "./WishlistTemplate";
const items = [
    {
        id: "1",
        title: "Product One",
        image: "https://placehold.co/64",
        price: 29.99,
        quantity: 1,
    },
    {
        id: "2",
        title: "Product Two",
        image: "https://placehold.co/64",
        price: 49.99,
        quantity: 2,
    },
];
const meta = {
    component: WishlistTemplate,
    args: { items },
};
export default meta;
export const Default = {};
