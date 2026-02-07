// packages/template-app/src/api/cart/route.ts
//
// Re-export the cart API handlers from `@acme/platform-core/cartApi` but
// explicitly opt into the Node.js runtime. The shared cart API defaults to
// the edge runtime which can cause development hangs when Node-specific
// modules (e.g. `crypto`) are required during compilation. By importing the
// handlers and setting `runtime` here, the template app avoids those edge
// limitations while keeping the implementation centralized.

import { DELETE, GET, PATCH, POST, PUT } from "@acme/platform-core/cartApi";

export { DELETE, GET, PATCH, POST, PUT };

// Run this route using the Node.js runtime to ensure full Node API support.
export const runtime = "nodejs";
