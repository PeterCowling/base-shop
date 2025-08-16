"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotFound;
var link_1 = require("next/link");
function NotFound() {
    return (<div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404 – Page not found</h1>
      <p className="text-muted-foreground text-sm">
        Sorry, the page you are looking for does not exist.
      </p>
      <link_1.default href="/cms" className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white">
        Back to CMS
      </link_1.default>
    </div>);
}
