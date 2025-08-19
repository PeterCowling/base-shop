// packages/template-app/src/app/[lang]/page.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
var HeroBanner_1 = require("@/components/home/HeroBanner");
var ReviewsCarousel_1 = require("@/components/home/ReviewsCarousel");
var ValueProps_1 = require("@/components/home/ValueProps");
var seo_1 = require("../../lib/seo");
function Home(_a) {
    var params = _a.params;
    var jsonLd = (0, seo_1.getStructuredData)({
        type: "WebPage",
        name: "Home",
        url: "/".concat(params.lang),
    });
    return (<>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: (0, seo_1.serializeJsonLd)(jsonLd) }}/>
      <HeroBanner_1.default />
      <ValueProps_1.ValueProps />
      <ReviewsCarousel_1.default />
    </>);
}
