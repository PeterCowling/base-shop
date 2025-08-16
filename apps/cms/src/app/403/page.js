// apps/cms/src/app/403/page.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AccessDenied;
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
var react_1 = require("react");
function AccessDenied() {
    return (<react_1.Suspense fallback={null}>
      <AccessDeniedContent />
    </react_1.Suspense>);
}
function AccessDeniedContent() {
    var searchParams = (0, navigation_1.useSearchParams)();
    var shop = searchParams.get("shop");
    var href = shop ? "/cms/shop/".concat(shop, "/products") : "/products";
    return (<div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-red-600">403 – Access denied</h1>
      <p className="text-muted-foreground text-sm">
        You don’t have permission to perform this action.
      </p>
      <link_1.default href={href} className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white">
        Back to catalogue
      </link_1.default>
    </div>);
}
