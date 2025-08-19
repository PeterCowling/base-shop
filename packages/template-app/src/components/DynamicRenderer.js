"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = exports.TestimonialSlider = exports.Testimonials = exports.Image = exports.Gallery = exports.ContactFormWithMap = exports.ContactForm = exports.BlogListing = void 0;
// packages/template-app/src/components/DynamicRenderer.tsx
("use client");
var image_1 = require("next/image");
var react_1 = require("react");
var HeroBanner_1 = require("@/components/cms/blocks/HeroBanner");
var ReviewsCarousel_1 = require("@/components/home/ReviewsCarousel");
var ValueProps_1 = require("@/components/home/ValueProps");
var ProductGrid_1 = require("@platform-core/components/shop/ProductGrid");
var BlogListing_1 = require("@/components/cms/blocks/BlogListing");
exports.BlogListing = BlogListing_1.default;
var ContactForm_1 = require("@/components/cms/blocks/ContactForm");
exports.ContactForm = ContactForm_1.default;
var ContactFormWithMap_1 = require("@/components/cms/blocks/ContactFormWithMap");
exports.ContactFormWithMap = ContactFormWithMap_1.default;
var Gallery_1 = require("@/components/cms/blocks/Gallery");
exports.Gallery = Gallery_1.default;
var Testimonials_1 = require("@/components/cms/blocks/Testimonials");
exports.Testimonials = Testimonials_1.default;
var TestimonialSlider_1 = require("@/components/cms/blocks/TestimonialSlider");
exports.TestimonialSlider = TestimonialSlider_1.default;
var textarea_1 = require("@/components/atoms/primitives/textarea");
Object.defineProperty(exports, "Text", { enumerable: true, get: function () { return textarea_1.Textarea; } });
var products_1 = require("@platform-core/products");
/* ------------------------------------------------------------------
 * next/image wrapper usable in CMS blocks
 * ------------------------------------------------------------------ */
var CmsImage = react_1.default.memo(function (_a) {
    var src = _a.src, _b = _a.alt, alt = _b === void 0 ? "" : _b, width = _a.width, height = _a.height, rest = __rest(_a, ["src", "alt", "width", "height"]);
    return (<image_1.default src={src} alt={alt} width={width} height={height} {...rest}/>);
});
exports.Image = CmsImage;
/* ------------------------------------------------------------------
 * Registry: block type → React component
 * ------------------------------------------------------------------ */
var registry = {
    HeroBanner: HeroBanner_1.default,
    ValueProps: ValueProps_1.ValueProps,
    ReviewsCarousel: ReviewsCarousel_1.default,
    ProductGrid: ProductGrid_1.ProductGrid,
    Gallery: Gallery_1.default,
    ContactForm: ContactForm_1.default,
    ContactFormWithMap: ContactFormWithMap_1.default,
    BlogListing: BlogListing_1.default,
    Testimonials: Testimonials_1.default,
    TestimonialSlider: TestimonialSlider_1.default,
    Image: CmsImage,
    Text: textarea_1.Textarea,
};
/* ------------------------------------------------------------------
 * DynamicRenderer
 * ------------------------------------------------------------------ */
function DynamicRenderer(_a) {
    var components = _a.components;
    return (<>
      {components.map(function (block) {
            var Comp = registry[block.type];
            if (!Comp) {
                console.warn("Unknown component type: ".concat(block.type));
                return null;
            }
            var _a = block, id = _a.id, props = __rest(_a, ["id"]);
            if (block.type === "ProductGrid") {
                return (<Comp key={id} {...props} skus={products_1.PRODUCTS}/>);
            }
            return <Comp key={id} {...props}/>;
        })}
    </>);
}
exports.default = react_1.default.memo(DynamicRenderer);
