import { OrderConfirmationTemplate } from "./OrderConfirmationTemplate";
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
    component: OrderConfirmationTemplate,
    args: {
        orderId: "ABC123",
        cart,
    },
};
export default meta;
export const Default = {};
