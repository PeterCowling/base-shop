import { createShopCartApi } from "@acme/platform-core/cartApiForShop";

const SHOP = "caryina";

export const { GET, POST, PATCH, DELETE, PUT } = createShopCartApi({ shop: SHOP });
