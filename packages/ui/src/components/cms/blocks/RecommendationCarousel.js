import { jsx as _jsx } from "react/jsx-runtime";
import { RecommendationCarousel as BaseCarousel, } from "../../organisms/RecommendationCarousel";
import { PRODUCTS } from "@acme/platform-core/products";
export default function CmsRecommendationCarousel({ minItems, maxItems, ...rest }) {
    return (_jsx(BaseCarousel, { minItems: minItems, maxItems: maxItems, ...rest }));
}
export function getRuntimeProps() {
    return { endpoint: "/api", products: PRODUCTS };
}
