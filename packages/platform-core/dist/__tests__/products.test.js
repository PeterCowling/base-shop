"use strict";
// packages/platform-core/__tests__/products.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
var products_1 = require("../products");
describe("getProductBySlug", function () {
    it("returns the matching product", function () {
        var slug = products_1.PRODUCTS[0].slug;
        expect((0, products_1.getProductBySlug)(slug)).toEqual(products_1.PRODUCTS[0]);
    });
});
