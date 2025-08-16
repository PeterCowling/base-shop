"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewComponents = exports.renderBlock = exports.schema = void 0;
var editor_1 = require("@portabletext/editor");
var react_1 = require("react");
var _ui_1 = require("@ui");
var ProductPreview_1 = require("./ProductPreview");
var invalidProductContext_1 = require("./invalidProductContext");
exports.schema = (0, editor_1.defineSchema)({
    decorators: [{ name: "strong" }, { name: "em" }],
    styles: [
        { name: "normal" },
        { name: "h1" },
        { name: "h2" },
        { name: "h3" },
    ],
    lists: [{ name: "bullet" }, { name: "number" }],
    annotations: [
        {
            name: "link",
            type: "object",
            fields: [{ name: "href", type: "string" }],
        },
    ],
    inlineObjects: [],
    blockObjects: [
        {
            name: "productReference",
            type: "object",
            fields: [{ name: "slug", type: "string" }],
        },
        {
            name: "embed",
            type: "object",
            fields: [{ name: "url", type: "string" }],
        },
        {
            name: "image",
            type: "object",
            fields: [
                { name: "url", type: "string" },
                { name: "alt", type: "string" },
            ],
        },
    ],
});
function ProductReferenceBlock(props) {
    var editor = (0, editor_1.useEditor)();
    var ctx = (0, react_1.useContext)(invalidProductContext_1.InvalidProductContext);
    var slug = props.value.slug;
    var isInvalid = Boolean(ctx === null || ctx === void 0 ? void 0 : ctx.invalidProducts[props.value._key]);
    var remove = function () {
        var sel = {
            anchor: { path: props.path, offset: 0 },
            focus: { path: props.path, offset: 0 },
        };
        editor_1.PortableTextEditor.delete(editor, sel, { mode: "blocks" });
    };
    var edit = function () {
        var next = prompt("Product slug", slug);
        if (!next)
            return;
        var sel = {
            anchor: { path: props.path, offset: 0 },
            focus: { path: props.path, offset: 0 },
        };
        editor_1.PortableTextEditor.delete(editor, sel, { mode: "blocks" });
        editor_1.PortableTextEditor.insertBlock(editor, "productReference", { slug: next });
    };
    var className = "space-y-2 ".concat(isInvalid ? "rounded border border-red-500 p-2" : "");
    return react_1.default.createElement("div", { className: className }, react_1.default.createElement(ProductPreview_1.default, {
        slug: slug,
        onValidChange: function (valid) {
            return ctx === null || ctx === void 0 ? void 0 : ctx.markValidity(props.value._key, valid, slug);
        },
    }), react_1.default.createElement("div", { className: "flex gap-2" }, react_1.default.createElement(_ui_1.Button, { type: "button", variant: "outline", onClick: edit }, "Edit"), react_1.default.createElement(_ui_1.Button, { type: "button", variant: "outline", onClick: remove }, "Remove")));
}
var renderBlock = function (props) {
    if (props.value._type === "productReference") {
        return react_1.default.createElement(ProductReferenceBlock, props);
    }
    if (props.value._type === "embed") {
        return react_1.default.createElement("div", { className: "aspect-video" }, react_1.default.createElement("iframe", {
            src: props.value.url,
            className: "h-full w-full",
        }));
    }
    if (props.value._type === "image") {
        return react_1.default.createElement("img", {
            src: props.value.url,
            alt: props.value.alt || "",
            className: "max-w-full",
        });
    }
    return react_1.default.createElement("div", null, props.children);
};
exports.renderBlock = renderBlock;
exports.previewComponents = {
    types: {
        productReference: function (_a) {
            var value = _a.value;
            return react_1.default.createElement(ProductPreview_1.default, { slug: value.slug });
        },
        embed: function (_a) {
            var value = _a.value;
            return react_1.default.createElement("div", { className: "aspect-video" }, react_1.default.createElement("iframe", { src: value.url, className: "h-full w-full" }));
        },
        image: function (_a) {
            var value = _a.value;
            return react_1.default.createElement("img", {
                src: value.url,
                alt: value.alt || "",
                className: "max-w-full",
            });
        },
    },
    marks: {
        link: function (_a) {
            var children = _a.children, value = _a.value;
            return react_1.default.createElement("a", {
                href: value.href,
                className: "text-blue-600 underline",
                target: "_blank",
                rel: "noopener noreferrer",
            }, children);
        },
    },
    block: {
        h1: function (_a) {
            var children = _a.children;
            return react_1.default.createElement("h1", null, children);
        },
        h2: function (_a) {
            var children = _a.children;
            return react_1.default.createElement("h2", null, children);
        },
        h3: function (_a) {
            var children = _a.children;
            return react_1.default.createElement("h3", null, children);
        },
    },
};
