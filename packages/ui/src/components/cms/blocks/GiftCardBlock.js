"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import { Price } from "../../atoms/Price";
export default function GiftCardBlock({ denominations = [25, 50, 100], description, }) {
    const [amount, setAmount] = useState(denominations[0]);
    const sku = {
        id: `gift-${amount}`,
        slug: `gift-card-${amount}`,
        title: `Gift Card`,
        price: amount,
        deposit: 0,
        stock: 9999,
        forSale: true,
        forRental: false,
        media: [],
        sizes: [],
        description: description ?? "",
    };
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [description && _jsx("p", { children: description }), _jsx("div", { className: "flex gap-2", children: denominations.map((value) => (_jsx("button", { type: "button", onClick: () => setAmount(value), className: `rounded border px-3 py-2 ${amount === value ? "bg-fg" : "bg-bg"}`, "data-token": amount === value ? "--color-fg" : "--color-bg", children: _jsx(Price, { amount: value, className: amount === value ? "text-bg" : "text-fg", "data-token": amount === value ? "--color-bg" : "--color-fg" }) }, value))) }), _jsx(AddToCartButton, { sku: sku })] }));
}
