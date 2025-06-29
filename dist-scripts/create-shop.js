"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var path_1 = require("path");
var ulid_1 = require("ulid");
var constants_1 = require("../packages/types/src/constants");
function parseArgs(argv) {
    var id = argv[0];
    if (!id) {
        console.error("Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2]");
        process.exit(1);
    }
    var opts = {
        type: "sale",
        theme: "base",
        payment: [],
        shipping: [],
    };
    argv.slice(1).forEach(function (arg) {
        if (!arg.startsWith("--"))
            return;
        var _a = arg.slice(2).split("="), key = _a[0], _b = _a[1], val = _b === void 0 ? "" : _b;
        switch (key) {
            case "type":
                if (val === "sale" || val === "rental")
                    opts.type = val;
                else {
                    console.error("--type must be 'sale' or 'rental'");
                    process.exit(1);
                }
                break;
            case "theme":
                opts.theme = val || opts.theme;
                break;
            case "payment":
                opts.payment = val.split(",").filter(Boolean);
                break;
            case "shipping":
                opts.shipping = val.split(",").filter(Boolean);
                break;
            default:
                console.error("Unknown option ".concat(key));
                process.exit(1);
        }
    });
    return [id, opts];
}
var _b = parseArgs(process.argv.slice(2)), shopId = _b[0], options = _b[1];
/* ────────────────────────────────────────────────────────── *
 * File-system locations                                      *
 * ────────────────────────────────────────────────────────── */
var templateApp = (0, path_1.join)("packages", "template-app");
var newApp = (0, path_1.join)("apps", shopId);
if (!(0, fs_1.existsSync)((0, path_1.join)("packages", "themes", options.theme))) {
    console.error("Theme '".concat(options.theme, "' not found in packages/themes"));
    process.exit(1);
}
/* ────────────────────────────────────────────────────────── *
 * Copy template → new app                                    *
 * ────────────────────────────────────────────────────────── */
(0, fs_1.cpSync)(templateApp, newApp, {
    recursive: true,
    filter: function (src) { return !/node_modules/.test(src); },
});
var pkgPath = (0, path_1.join)(newApp, "package.json");
var pkg = JSON.parse((0, fs_1.readFileSync)(pkgPath, "utf8"));
/* --- guarantee `dependencies` exists to silence TS 18048 --- */
(_a = pkg.dependencies) !== null && _a !== void 0 ? _a : (pkg.dependencies = {}); // now definitely Record<string, string>
Object.keys(pkg.dependencies).forEach(function (k) {
    if (k.startsWith("@themes/"))
        delete pkg.dependencies[k];
});
pkg.dependencies["@themes/".concat(options.theme)] = "workspace:*";
pkg.name = "@apps/shop-".concat(shopId);
(0, fs_1.writeFileSync)(pkgPath, JSON.stringify(pkg, null, 2));
/* ────────────────────────────────────────────────────────── *
 * Swap the global CSS theme import                           *
 * ────────────────────────────────────────────────────────── */
var cssPath = (0, path_1.join)(newApp, "src", "app", "globals.css");
var css = (0, fs_1.readFileSync)(cssPath, "utf8").replace(/@themes\/[^/]+\/tokens.css/, "@themes/".concat(options.theme, "/tokens.css"));
(0, fs_1.writeFileSync)(cssPath, css);
/* ────────────────────────────────────────────────────────── *
 * Seed .env and data folder                                  *
 * ────────────────────────────────────────────────────────── */
function genSecret(bytes) {
    if (bytes === void 0) { bytes = 16; }
    return (0, crypto_1.randomBytes)(bytes).toString("hex");
}
var envContent = "NEXT_PUBLIC_SHOP_ID=".concat(shopId, "\n");
envContent += "PREVIEW_TOKEN_SECRET=".concat(genSecret(), "\n");
var envVars = __spreadArray(__spreadArray([], options.payment, true), options.shipping, true);
if (envVars.length === 0)
    envVars.push("stripe");
for (var _i = 0, envVars_1 = envVars; _i < envVars_1.length; _i++) {
    var p = envVars_1[_i];
    if (p === "stripe") {
        envContent += "STRIPE_SECRET_KEY=".concat(genSecret(), "\n");
        envContent += "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=".concat(genSecret(), "\n");
    }
    else {
        envContent += "".concat(p.toUpperCase(), "_KEY=").concat(genSecret(), "\n");
    }
}
envContent += "NEXTAUTH_SECRET=".concat(genSecret(), "\n");
(0, fs_1.writeFileSync)((0, path_1.join)(newApp, ".env"), envContent);
var newData = (0, path_1.join)("data", "shops", shopId);
if ((0, fs_1.existsSync)(newData)) {
    console.error("Data for shop ".concat(shopId, " already exists"));
    process.exit(1);
}
(0, fs_1.mkdirSync)(newData, { recursive: true });
(0, fs_1.writeFileSync)((0, path_1.join)(newData, "settings.json"), JSON.stringify({ languages: __spreadArray([], constants_1.LOCALES, true) }, null, 2));
(0, fs_1.writeFileSync)((0, path_1.join)(newData, "shop.json"), JSON.stringify({
    id: shopId,
    name: shopId,
    catalogFilters: [],
    themeId: options.theme,
    type: options.type,
    paymentProviders: options.payment,
    shippingProviders: options.shipping,
    priceOverrides: {},
    localeOverrides: {},
}, null, 2));
var now = new Date().toISOString();
var sampleProduct = {
    id: (0, ulid_1.ulid)(),
    sku: "SAMPLE-1",
    title: { en: "Sample", de: "Sample", it: "Sample" },
    description: {
        en: "Sample product",
        de: "Sample product",
        it: "Sample product",
    },
    price: 1000,
    currency: "EUR",
    images: [],
    status: "draft",
    shop: shopId,
    row_version: 1,
    created_at: now,
    updated_at: now,
};
if (options.type === "rental") {
    sampleProduct.deposit = 1000;
    sampleProduct.rentalTerms = "Return within 30 days";
}
(0, fs_1.writeFileSync)((0, path_1.join)(newData, "products.json"), JSON.stringify([sampleProduct], null, 2));
console.log("Shop \"".concat(shopId, "\" created."));
