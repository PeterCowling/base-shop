"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
var child_process_1 = require("child_process");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var node_readline_1 = __importDefault(require("node:readline"));
var path_1 = require("path");
var ulid_1 = require("ulid");
var constants_1 = require("../packages/types/src/constants");
function parseArgs(argv) {
    var id = argv[0];
    if (!id) {
        console.error("Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2] [--template=name]");
        process.exit(1);
    }
    var opts = {
        type: "sale",
        theme: "base",
        template: "template-app",
        payment: [],
        shipping: [],
    };
    var themeProvided = false;
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
                themeProvided = true;
                break;
            case "template":
                opts.template = val || opts.template;
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
    return [id, opts, themeProvided];
}
var _b = parseArgs(process.argv.slice(2)), shopId = _b[0], options = _b[1], themeProvided = _b[2];
function ensureTheme() {
    return __awaiter(this, void 0, void 0, function () {
        var themesDir, themes_1, rl_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(!themeProvided && process.stdin.isTTY)) return [3 /*break*/, 2];
                    themesDir = (0, path_1.join)("packages", "themes");
                    themes_1 = (0, fs_1.readdirSync)(themesDir, { withFileTypes: true })
                        .filter(function (d) { return d.isDirectory(); })
                        .map(function (d) { return d.name; });
                    rl_1 = node_readline_1.default.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    return [4 /*yield*/, new Promise(function (resolve) {
                            rl_1.question("Select theme [".concat(themes_1.join(", "), "]: "), function (ans) {
                                if (themes_1.includes(ans))
                                    options.theme = ans;
                                rl_1.close();
                                resolve();
                            });
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
await ensureTheme();
/* ────────────────────────────────────────────────────────── *
 * File-system locations                                      *
 * ────────────────────────────────────────────────────────── */
var templateApp = (0, path_1.join)("packages", options.template);
var newApp = (0, path_1.join)("apps", shopId);
if (!(0, fs_1.existsSync)((0, path_1.join)("packages", "themes", options.theme))) {
    console.error("Theme '".concat(options.theme, "' not found in packages/themes"));
    process.exit(1);
}
if (!(0, fs_1.existsSync)(templateApp)) {
    console.error("Template '".concat(options.template, "' not found in packages"));
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
// Attempt to run Cloudflare's C3 tool if available
try {
    var result = (0, child_process_1.spawnSync)("npx", ["--yes", "create-cloudflare", newApp], {
        stdio: "inherit",
    });
    if (result.status !== 0) {
        console.warn("C3 process failed or not available. Skipping.");
    }
}
catch (err) {
    console.warn("C3 not available, skipping.");
}
