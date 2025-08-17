"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Cancelled;
var navigation_1 = require("next/navigation");
function Cancelled() {
    var searchParams = (0, navigation_1.useSearchParams)();
    var error = searchParams.get("error");
    return (<div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Payment cancelled</h1>
      <p>You have not been charged. Feel free to keep shopping.</p>
      {error && (<p className="mt-4 text-sm text-danger" data-token="--color-danger">
          {error}
        </p>)}
    </div>);
}
