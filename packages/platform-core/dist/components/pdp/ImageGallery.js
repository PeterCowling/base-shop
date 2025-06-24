// src/components/pdp/ImageGallery.tsx
"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ImageGallery;
var jsx_runtime_1 = require("react/jsx-runtime");
var image_1 = __importDefault(require("next/image"));
var react_1 = require("react");
function ImageGallery(_a) {
    var src = _a.src, alt = _a.alt;
    // single image today; gallery-ready later
    var _b = (0, react_1.useState)(false), zoom = _b[0], setZoom = _b[1];
    return ((0, jsx_runtime_1.jsx)("figure", { className: "relative w-full aspect-square cursor-zoom-in", onClick: function () { return setZoom(!zoom); }, children: (0, jsx_runtime_1.jsx)(image_1.default, { src: src, alt: alt, fill: true, sizes: "(min-width: 1024px) 50vw, 100vw", className: "object-cover rounded-lg transition-transform duration-300 ".concat(zoom ? "scale-125 cursor-zoom-out" : ""), priority: true }) }));
}
