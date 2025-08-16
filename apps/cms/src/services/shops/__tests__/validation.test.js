"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var validation_1 = require("../validation");
describe("validation service", function () {
    it("parses a valid shop form", function () {
        var _a;
        var formData = new FormData();
        formData.set("id", "1");
        formData.set("name", "My Shop");
        formData.set("themeId", "theme1");
        var result = (0, validation_1.parseShopForm)(formData);
        expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.id).toBe("1");
    });
    it("returns errors for invalid shop form", function () {
        var formData = new FormData();
        var result = (0, validation_1.parseShopForm)(formData);
        expect(result.errors).toBeDefined();
    });
});
