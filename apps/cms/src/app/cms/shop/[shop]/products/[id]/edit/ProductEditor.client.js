// apps/cms/src/app/cms/shop/[shop]/products/[id]/edit/ProductEditor.tsx
"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProductEditor;
var products_server_1 = require("@cms/actions/products.server");
var ProductEditorForm_1 = require("@ui/components/cms/ProductEditorForm");
function ProductEditor(_a) {
    var _b;
    var shop = _a.shop, initialProduct = _a.initialProduct, languages = _a.languages;
    var onSave = function (fd) { return (0, products_server_1.updateProduct)(shop, fd); };
    return (<ProductEditorForm_1.default product={__assign(__assign({}, initialProduct), { variants: (_b = initialProduct.variants) !== null && _b !== void 0 ? _b : {} })} onSave={onSave} locales={languages}/>);
}
