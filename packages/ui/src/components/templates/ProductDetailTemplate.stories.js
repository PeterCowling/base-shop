import { ProductDetailTemplate } from "./ProductDetailTemplate";
const product = {
    id: "1",
    title: "Sample Product",
    image: "https://placehold.co/600",
    price: 99.99,
    description: "A wonderful item",
};
const meta = {
    component: ProductDetailTemplate,
    args: { product },
};
export default meta;
export const Default = {};
