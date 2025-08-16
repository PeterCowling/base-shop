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
exports.default = useNewPageState;
var react_1 = require("react");
function useNewPageState(languages) {
    var createEmptyLocaleRecord = function () {
        return languages.reduce(function (acc, l) {
            var _a;
            return (__assign(__assign({}, acc), (_a = {}, _a[l] = "", _a)));
        }, {});
    };
    var _a = (0, react_1.useState)(""), slug = _a[0], setSlug = _a[1];
    var _b = (0, react_1.useState)(createEmptyLocaleRecord), title = _b[0], setTitle = _b[1];
    var _c = (0, react_1.useState)(createEmptyLocaleRecord), desc = _c[0], setDesc = _c[1];
    var _d = (0, react_1.useState)(createEmptyLocaleRecord), image = _d[0], setImage = _d[1];
    var _e = (0, react_1.useState)([]), components = _e[0], setComponents = _e[1];
    var _f = (0, react_1.useState)(null), draftId = _f[0], setDraftId = _f[1];
    var _g = (0, react_1.useState)(false), adding = _g[0], setAdding = _g[1];
    var _h = (0, react_1.useState)(""), pageLayout = _h[0], setPageLayout = _h[1];
    var resetFields = function () {
        setSlug("");
        setTitle(createEmptyLocaleRecord());
        setDesc(createEmptyLocaleRecord());
        setImage(createEmptyLocaleRecord());
        setComponents([]);
        setDraftId(null);
        setPageLayout("");
    };
    return {
        slug: slug,
        setSlug: setSlug,
        title: title,
        setTitle: setTitle,
        desc: desc,
        setDesc: setDesc,
        image: image,
        setImage: setImage,
        components: components,
        setComponents: setComponents,
        draftId: draftId,
        setDraftId: setDraftId,
        adding: adding,
        setAdding: setAdding,
        pageLayout: pageLayout,
        setPageLayout: setPageLayout,
        resetFields: resetFields,
    };
}
