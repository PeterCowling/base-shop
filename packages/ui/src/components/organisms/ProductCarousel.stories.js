import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { ProductCarousel } from "./ProductCarousel";
const products = Array.from({ length: 5 }).map((_, i) => ({
    id: String(i + 1),
    title: `Product ${i + 1}`,
    image: `https://placehold.co/300x300?text=${i + 1}`,
    price: (i + 1) * 10,
}));
function AutoCarousel(props) {
    const { autoplay, ...rest } = props;
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (!autoplay || !ref.current)
            return;
        const scroller = ref.current.querySelector(".flex");
        if (!scroller)
            return;
        let idx = 0;
        const id = setInterval(() => {
            idx = (idx + 1) % products.length;
            scroller.scrollTo({
                left: scroller.clientWidth * idx,
                behavior: "smooth",
            });
        }, 1500);
        return () => clearInterval(id);
    }, [autoplay]);
    return (_jsx("div", { ref: ref, children: _jsx(ProductCarousel, { ...rest }) }));
}
const meta = {
    component: AutoCarousel,
    args: {
        products,
        autoplay: false,
    },
};
export default meta;
export const Default = {};
export const Autoplay = {
    args: { autoplay: true },
};
