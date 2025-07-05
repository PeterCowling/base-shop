import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CartProvider, useCart } from "@/contexts/CartContext";
import * as React from "react";
import { Button } from "../atoms-shadcn";
import { MiniCart } from "./MiniCart.client";
const sku1 = {
    id: "1",
    slug: "item-one",
    title: "Item One",
    price: 20,
    deposit: 0,
    forSale: true,
    forRental: false,
    image: "https://placehold.co/64",
    sizes: [],
    description: "",
};
const sku2 = {
    id: "2",
    slug: "item-two",
    title: "Item Two",
    price: 15,
    deposit: 0,
    forSale: true,
    forRental: false,
    image: "https://placehold.co/64",
    sizes: [],
    description: "",
};
function CartInitializer({ items }) {
    const [, dispatch] = useCart();
    React.useEffect(() => {
        Object.values(items).forEach((line) => {
            dispatch({ type: "add", sku: line.sku, size: line.size });
            if (line.qty > 1) {
                dispatch({ type: "setQty", id: line.sku.id, qty: line.qty });
            }
        });
    }, [items, dispatch]);
    return null;
}
function MiniCartWrapper({ items }) {
    return (_jsxs(CartProvider, { children: [_jsx(CartInitializer, { items: items }), _jsx(MiniCart, { trigger: _jsx(Button, { children: "Open cart" }) })] }));
}
const meta = {
    component: MiniCartWrapper,
    args: {
        items: {},
    },
};
export default meta;
export const Empty = {};
export const Filled = {
    args: {
        items: {
            [sku1.id]: { sku: sku1, qty: 2 },
            [sku2.id]: { sku: sku2, qty: 1 },
        },
    },
};
