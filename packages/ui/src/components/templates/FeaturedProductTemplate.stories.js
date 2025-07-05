import { FeaturedProductTemplate } from "./FeaturedProductTemplate";
const meta = {
    component: FeaturedProductTemplate,
    args: {
        product: {
            id: "1",
            title: "Sample Product",
            image: "/placeholder.svg",
            price: 99,
            rating: 4,
            features: ["Feature A", "Feature B"],
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
