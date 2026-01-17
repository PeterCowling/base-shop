// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
import "@acme/zod-utils/initZod";

// Align cover-me-pretty's cart API with the canonical platform-core
// implementation. All handlers are re-exported from `@acme/platform-core/cartApi`
// so this app shares the same CartStore and cookie semantics as the template
// app and CMS.
import { DELETE, GET, PATCH, POST, PUT } from "@acme/platform-core/cartApi";

export { DELETE, GET, PATCH, POST, PUT };

// Use the Node.js runtime so platform-core utilities that rely on Node APIs
// (e.g. crypto, optional Redis client) work consistently in this route.
export const runtime = "nodejs";
