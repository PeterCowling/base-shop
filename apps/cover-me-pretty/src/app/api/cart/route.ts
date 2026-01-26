// apps/cover-me-pretty/src/app/api/cart/route.ts
// Shim App Router handlers to the shared cart implementation while declaring
// `runtime` locally so Next.js can detect it correctly.

// Use the Node.js runtime so platform-core utilities that depend on `crypto`
// are available in this API route.
export const runtime = "nodejs";

export { DELETE, GET, PATCH, POST, PUT } from "../../../api/cart/route";
