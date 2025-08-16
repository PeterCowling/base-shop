// apps/cms/src/app/[lang]/page.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
var ReviewsCarousel_1 = require("@/components/home/ReviewsCarousel");
var ValueProps_1 = require("@/components/home/ValueProps");
var HeroBanner_client_1 = require("@ui/components/home/HeroBanner.client");
function Home() {
    return (<>
      <HeroBanner_client_1.default />
      <ValueProps_1.ValueProps />
      <ReviewsCarousel_1.default />
    </>);
}
