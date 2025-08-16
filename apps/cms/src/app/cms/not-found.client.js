"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CmsNotFound;
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
function CmsNotFound() {
    var pathname = (0, navigation_1.usePathname)();
    var segments = pathname.split("/").filter(Boolean);
    var shopIndex = segments.indexOf("shop");
    var shop = shopIndex >= 0 ? segments[shopIndex + 1] : null;
    var href = shop ? "/cms/shop/".concat(shop) : "/cms";
    return (<div className="flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">404 – Page not found</h1>
      <link_1.default href={href} className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white">
        Back to dashboard
      </link_1.default>
    </div>);
}
