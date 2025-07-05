import { ProductMediaGalleryTemplate } from "./ProductMediaGalleryTemplate";
const meta = {
    component: ProductMediaGalleryTemplate,
    args: {
        product: {
            id: "1",
            title: "Media Product",
            image: "/placeholder.svg",
            price: 49,
            media: [
                { type: "image", src: "/placeholder.svg" },
                { type: "image", src: "/placeholder.svg" },
            ],
        },
        ctaLabel: "Add to cart",
    },
    argTypes: {
        product: { control: "object" },
        ctaLabel: { control: "text" },
        onAddToCart: { action: "add-to-cart" },
    },
};
export default meta;
export const Default = {};
