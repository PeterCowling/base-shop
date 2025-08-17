"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchShop = fetchShop;
exports.persistShop = persistShop;
exports.fetchSettings = fetchSettings;
exports.persistSettings = persistSettings;
exports.fetchDiffHistory = fetchDiffHistory;
var settings_server_1 = require("@platform-core/repositories/settings.server");
var shop_server_1 = require("@platform-core/repositories/shop.server");
function fetchShop(shop) {
    return (0, shop_server_1.getShopById)(shop);
}
function persistShop(shop, patch) {
    return (0, shop_server_1.updateShopInRepo)(shop, patch);
}
function fetchSettings(shop) {
    return (0, settings_server_1.getShopSettings)(shop);
}
function persistSettings(shop, settings) {
    return (0, settings_server_1.saveShopSettings)(shop, settings);
}
function fetchDiffHistory(shop) {
    return (0, settings_server_1.diffHistory)(shop);
}
