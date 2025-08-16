"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var i18n_1 = require("@acme/i18n");
var validation_1 = require("./validation");
describe("pages validation", function () {
    it("creates empty translated object for all locales", function () {
        var obj = (0, validation_1.emptyTranslated)();
        expect(obj).toEqual(Object.fromEntries(i18n_1.LOCALES.map(function (l) { return [l, ""]; })));
    });
    it("parses valid create data", function () {
        var result = validation_1.createSchema.parse({ slug: "home", components: "[]" });
        expect(result.slug).toBe("home");
        expect(result.components).toEqual([]);
    });
    it("rejects invalid image url", function () {
        var res = validation_1.createSchema.safeParse({
            slug: "home",
            image: "not-url",
            components: "[]",
        });
        expect(res.success).toBe(false);
    });
    it("requires slug on update", function () {
        var res = validation_1.updateSchema.safeParse({
            id: "1",
            updatedAt: "now",
            slug: "",
            components: "[]",
        });
        expect(res.success).toBe(false);
    });
    it("parses components field", function () {
        expect(validation_1.componentsField.parse("[]")).toEqual([]);
    });
});
