"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = Page;
// apps/shop-bcd/src/app/account/orders/page.tsx
var Orders_1 = require("@ui/components/account/Orders");
Object.defineProperty(exports, "metadata", { enumerable: true, get: function () { return Orders_1.metadata; } });
var shop_json_1 = require("../../../../shop.json");
function Page() {
    return (<Orders_1.default shopId={shop_json_1.default.id} returnsEnabled={shop_json_1.default.returnsEnabled} returnPolicyUrl={shop_json_1.default.returnPolicyUrl} trackingEnabled={shop_json_1.default.trackingEnabled} trackingProviders={shop_json_1.default.trackingProviders}/>);
}
