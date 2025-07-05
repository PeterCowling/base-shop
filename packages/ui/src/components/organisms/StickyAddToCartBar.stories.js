import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { StickyAddToCartBar } from "./StickyAddToCartBar";
const product = {
    id: "1",
    title: "Sample Product",
    image: "https://placehold.co/300x300",
    price: 30,
};
function ScrollWrapper(args) {
    const [sticky, setSticky] = React.useState(false);
    const onScroll = (e) => {
        setSticky(e.currentTarget.scrollTop > 40);
    };
    return (_jsxs("div", { onScroll: onScroll, className: "relative h-64 overflow-y-auto border", children: [_jsx("div", { style: { height: "200px" } }), _jsx(StickyAddToCartBar, { ...args, style: { position: sticky ? "sticky" : "static", bottom: 0 } }), _jsx("div", { style: { height: "300px" } })] }));
}
const meta = {
    component: StickyAddToCartBar,
    args: { product },
    render: (args) => _jsx(ScrollWrapper, { ...args }),
};
export default meta;
export const Default = {};
