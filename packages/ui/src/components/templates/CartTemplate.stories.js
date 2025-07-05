import { CartTemplate } from "./CartTemplate";
const cart = {
    sku1: {
        sku: {
            id: "sku1",
            slug: "prod-1",
            title: "Product 1",
            price: 1000,
            deposit: 100,
            forSale: true,
            forRental: false,
            image: "https://placehold.co/100",
            sizes: [],
            description: "",
        },
        qty: 1,
    },
};
const meta = {
    component: CartTemplate,
    args: {
        cart,
    },
};
export default meta;
export const Default = {};
