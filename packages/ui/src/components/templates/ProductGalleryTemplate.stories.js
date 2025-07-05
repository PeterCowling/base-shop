import { ProductGalleryTemplate } from "./ProductGalleryTemplate";
const meta = {
    component: ProductGalleryTemplate,
    args: {
        products: [
            { id: "1", title: "Product 1", image: "/placeholder.svg", price: 10 },
            { id: "2", title: "Product 2", image: "/placeholder.svg", price: 20 },
            { id: "3", title: "Product 3", image: "/placeholder.svg", price: 30 },
        ],
        useCarousel: false,
        itemsPerSlide: 3,
    },
    argTypes: {
        products: { control: "object" },
        useCarousel: { control: "boolean" },
        itemsPerSlide: { control: { type: "number" } },
    },
};
export default meta;
export const Default = {};
