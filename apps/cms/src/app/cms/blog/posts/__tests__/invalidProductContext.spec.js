"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var invalidProductContext_1 = require("@cms/app/cms/blog/posts/invalidProductContext");
describe("InvalidProductContext", function () {
    it("tracks invalid products", function () {
        var wrapper = function (_a) {
            var children = _a.children;
            return (<invalidProductContext_1.InvalidProductProvider>{children}</invalidProductContext_1.InvalidProductProvider>);
        };
        var result = (0, react_1.renderHook)(function () { return (0, invalidProductContext_1.useInvalidProductContext)(); }, { wrapper: wrapper }).result;
        (0, react_1.act)(function () { return result.current.markValidity("k1", false, "p1"); });
        expect(result.current.invalidProducts).toEqual({ k1: "p1" });
        (0, react_1.act)(function () { return result.current.markValidity("k1", true, "p1"); });
        expect(result.current.invalidProducts).toEqual({});
    });
});
