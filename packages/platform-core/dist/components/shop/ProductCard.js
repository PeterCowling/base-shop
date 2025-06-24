"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCard = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var image_1 = __importDefault(require("next/image"));
var link_1 = __importDefault(require("next/link"));
var react_1 = require("react");
var AddToCartButton_1 = __importDefault(require("./AddToCartButton"));
function ProductCardInner(_a) {
    var sku = _a.sku;
    return ((0, jsx_runtime_1.jsxs)("article", { className: "border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "../product/".concat(sku.slug), className: "block relative aspect-square", children: (0, jsx_runtime_1.jsx)(image_1.default, { src: sku.image, alt: sku.title, fill: true, sizes: "(min-width: 640px) 25vw, 50vw", className: "object-cover rounded-md" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "font-medium", children: sku.title }), (0, jsx_runtime_1.jsxs)("div", { className: "font-semibold text-gray-900", children: ["\u20AC", sku.price] }), (0, jsx_runtime_1.jsx)(AddToCartButton_1.default, { sku: sku })] }));
}
exports.ProductCard = (0, react_1.memo)(ProductCardInner);
