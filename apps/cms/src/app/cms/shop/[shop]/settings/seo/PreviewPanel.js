"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var image_1 = require("next/image");
/**
 * Renders live previews for search engine result pages and social cards.
 */
var PreviewPanel = function (_a) {
    var title = _a.title, _b = _a.description, description = _b === void 0 ? "" : _b, image = _a.image, _c = _a.url, url = _c === void 0 ? "example.com" : _c;
    var placeholder = {
        title: title || "Title goes here",
        description: description || "Description goes here",
        url: url,
    };
    return (<div className="space-y-6">
      {/* SERP preview -------------------------------------------------- */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Google result</p>
        <div className="rounded-md border p-4 text-sm">
          <p className="text-blue-600">{placeholder.title}</p>
          <p className="text-green-700">{placeholder.url}</p>
          <p className="text-muted-foreground">{placeholder.description}</p>
        </div>
      </div>

      {/* Open Graph preview -------------------------------------------- */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Open Graph</p>
        <div className="flex gap-4 rounded-md border p-4">
          {image && (<image_1.default src={image} alt="preview image" width={120} height={120} className="size-20 rounded object-cover"/>)}
          <div className="text-sm">
            <p className="font-medium">{placeholder.title}</p>
            <p className="text-muted-foreground">{placeholder.description}</p>
            <p className="text-muted-foreground">{placeholder.url}</p>
          </div>
        </div>
      </div>

      {/* Twitter card preview ----------------------------------------- */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Twitter card</p>
        <div className="flex gap-4 rounded-md border p-4">
          {image && (<image_1.default src={image} alt="preview image" width={120} height={120} className="size-20 rounded object-cover"/>)}
          <div className="text-sm">
            <p className="font-medium">{placeholder.title}</p>
            <p className="text-muted-foreground">{placeholder.description}</p>
          </div>
        </div>
      </div>
    </div>);
};
exports.default = PreviewPanel;
