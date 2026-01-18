"use strict";
// packages/platform-core/repositories/json.server.ts
/**
 * Filesystem-backed JSON repositories — single barrel export.
 *
 * • readShop         – fetch shop metadata + theme tokens + nav
 * • readSettings     – fetch settings.json (alias of getShopSettings)
 * • getShopSettings  – underlying helper for settings.json
 * • saveShopSettings – write settings.json atomically
 * • diffHistory      – return patch history for settings.json
 * • products.server  – catalogue helpers (read/write/update/delete/…)
 *
 * The `readShop` helper pulls in a large dependency tree (including the
 * Prisma client) so we lazily import it.  This keeps simple JSON repo
 * consumers – such as unit tests that only touch product helpers – fast and
 * self-contained.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShopInRepo = exports.getShopById = exports.saveShopSettings = exports.getShopSettings = exports.diffHistory = exports.readSettings = void 0;
exports.readShop = readShop;
async function readShop(shop) {
    const mod = await Promise.resolve().then(() => __importStar(require("./shops.server")));
    return await mod.readShop(shop);
}
// Alias getShopSettings → readSettings so existing callers keep working.
var settings_server_1 = require("./settings.server");
Object.defineProperty(exports, "readSettings", { enumerable: true, get: function () { return settings_server_1.getShopSettings; } });
__exportStar(require("./products.server"), exports);
__exportStar(require("./inventory.server"), exports);
__exportStar(require("./pricing.server"), exports);
__exportStar(require("./returnLogistics.server"), exports);
var settings_server_2 = require("./settings.server");
Object.defineProperty(exports, "diffHistory", { enumerable: true, get: function () { return settings_server_2.diffHistory; } });
Object.defineProperty(exports, "getShopSettings", { enumerable: true, get: function () { return settings_server_2.getShopSettings; } });
Object.defineProperty(exports, "saveShopSettings", { enumerable: true, get: function () { return settings_server_2.saveShopSettings; } });
var shop_server_1 = require("./shop.server");
Object.defineProperty(exports, "getShopById", { enumerable: true, get: function () { return shop_server_1.getShopById; } });
Object.defineProperty(exports, "updateShopInRepo", { enumerable: true, get: function () { return shop_server_1.updateShopInRepo; } });
