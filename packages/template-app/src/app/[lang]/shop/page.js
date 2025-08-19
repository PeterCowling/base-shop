"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = ShopIndexPage;
// packages/template-app/src/app/[lang]/shop/page.tsx
var products_1 = require("@platform-core/products");
var ShopClient_client_1 = require("./ShopClient.client");
var seo_1 = require("../../../lib/seo");
exports.metadata = {
    title: "Shop · Base-Shop",
};
function ShopIndexPage(_a) {
    var params = _a.params;
    var jsonLd = (0, seo_1.getStructuredData)({
        type: "WebPage",
        name: "Shop",
        url: "/".concat(params.lang, "/shop"),
    });
    // ⬇️ Purely server-side: just pass static data to the client component
    return (<>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: (0, seo_1.serializeJsonLd)(jsonLd) }}/>
      <ShopClient_client_1.default skus={products_1.PRODUCTS}/>
    </>);
}
