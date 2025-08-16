"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema_1 = require("@cms/app/cms/blog/posts/schema");
jest.mock("@ui", function () { return ({ Button: function () { return null; } }); });
jest.mock("@portabletext/editor", function () { return ({ defineSchema: function (x) { return x; } }); });
describe("schema", function () {
    it("includes productReference block", function () {
        var block = schema_1.schema.blockObjects.find(function (b) { return b.name === "productReference"; });
        expect(block).toBeTruthy();
        expect(block.fields).toEqual([{ name: "slug", type: "string" }]);
    });
});
