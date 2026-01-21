// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
import "@acme/zod-utils/initZod";

// Align cover-me-pretty's cart API with the canonical platform-core
// implementation, but make it shop-aware by resolving SKUs from the shop
// catalogue + inventory repositories.
import { createShopCartApi } from "@acme/platform-core/cartApiForShop";
import shop from "../../../shop.json";

export const { DELETE, GET, PATCH, POST, PUT } = createShopCartApi({
  shop: shop.id,
  locale: "en",
});

// Use the Node.js runtime so platform-core utilities that rely on Node APIs
// (e.g. crypto, optional Redis client) work consistently in this route.
export const runtime = "nodejs";
