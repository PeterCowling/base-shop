// apps/shop-bcd/src/app/[lang]/page.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
var DynamicRenderer_1 = require("@ui/components/DynamicRenderer");
var BlogListing_1 = require("@ui/components/cms/blocks/BlogListing");
function Home(_a) {
    var components = _a.components, locale = _a.locale, latestPost = _a.latestPost;
    return (<>
      {latestPost && <BlogListing_1.default posts={[latestPost]}/>}
      <DynamicRenderer_1.default components={components} locale={locale}/>
    </>);
}
