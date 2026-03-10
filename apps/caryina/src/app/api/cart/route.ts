import { createShopCartApi } from "@acme/platform-core/cartApiForShop";

import { CARYINA_INVENTORY_BACKEND } from "@/lib/inventoryBackend";

const SHOP = "caryina";

export const { GET, POST, PATCH, DELETE, PUT } = createShopCartApi({
  shop: SHOP,
  inventoryBackend: CARYINA_INVENTORY_BACKEND,
});
