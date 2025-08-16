"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = ShopIndexPage;
// apps/cms/src/app/[lang]/shop/page.tsx
var products_1 = require("@/lib/products");
var ShopClient_client_1 = require("./ShopClient.client");
exports.metadata = {
    title: "Shop · Base-Shop",
};
function ShopIndexPage() {
    // ⬇️ Purely server-side: just pass static data to the client component
    return <ShopClient_client_1.default skus={products_1.PRODUCTS}/>;
}
