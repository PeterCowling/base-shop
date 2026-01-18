"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCard = void 0;
exports.Price = Price;
const jsx_runtime_1 = require("react/jsx-runtime");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const CurrencyContext_1 = require("../../contexts/CurrencyContext");
const shared_utils_1 = require("@acme/shared-utils");
const react_1 = require("react");
const AddToCartButton_client_1 = __importDefault(require("./AddToCartButton.client"));
function Price({ amount, currency }) {
    const [ctxCurrency] = (0, CurrencyContext_1.useCurrency)();
    const cur = currency ?? ctxCurrency ?? "EUR";
    return (0, jsx_runtime_1.jsx)("span", { children: (0, shared_utils_1.formatPrice)(amount, cur) });
}
function ProductCardInner({ sku }) {
    const SALE_LABEL = "Sale"; // i18n-exempt -- ABC-123 badge microcopy
    const NEW_LABEL = "New"; // i18n-exempt -- ABC-123 badge microcopy
    const CARD_SIZES = "(min-width: 640px) 25vw, 50vw"; // i18n-exempt -- ABC-123 responsive sizes attribute value
    return ((0, jsx_runtime_1.jsxs)("article", { className: "flex flex-col gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md", children: [" ", (0, jsx_runtime_1.jsx)(link_1.default, { href: `../product/${sku.slug}`, className: "relative block aspect-square", children: sku.media[0] && (sku.media[0].type === "image" ? ((0, jsx_runtime_1.jsx)(image_1.default, { src: sku.media[0].url, alt: sku.title, fill: true, sizes: CARD_SIZES, className: "rounded-md object-cover" })) : ((0, jsx_runtime_1.jsx)("video", { src: sku.media[0].url, className: "h-full w-full rounded-md object-cover", "data-aspect": "1/1", muted: true, playsInline: true }))) }), sku.badges?.sale && (0, jsx_runtime_1.jsx)("span", { "data-cy": "badge-sale", children: SALE_LABEL }), sku.badges?.new && (0, jsx_runtime_1.jsx)("span", { "data-cy": "badge-new", children: NEW_LABEL }), (0, jsx_runtime_1.jsx)("h3", { className: "font-medium", children: sku.title }), sku.price != null && ((0, jsx_runtime_1.jsx)("div", { className: "font-semibold text-gray-900", children: (0, jsx_runtime_1.jsx)(Price, { amount: sku.price }) })), (0, jsx_runtime_1.jsx)(AddToCartButton_client_1.default, { sku: sku })] }));
}
exports.ProductCard = (0, react_1.memo)(ProductCardInner);
