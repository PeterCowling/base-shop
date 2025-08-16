"use strict";
// apps/cms/src/middleware.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
var _auth_1 = require("@auth");
var jwt_1 = require("next-auth/jwt");
var server_1 = require("next/server");
var secret_1 = require("./auth/secret");
/**
 * Matches CMS write routes of the form `/cms/shop/<shop>/...` and captures the
 * shop slug.
 *
 * Examples:
 *   /cms/shop/{shop}/products/{id}/edit
 *   /cms/shop/{shop}/settings
 *   /cms/shop/{shop}/media (and subpaths)
 */
var ADMIN_PATH_REGEX = /^\/cms\/shop\/([^/]+)\/(?:products\/[^/]+\/edit|settings|media(?:\/|$))/;
function middleware(req) {
    return __awaiter(this, void 0, void 0, function () {
        var pathname, token, role, url, matchShop, url, match, url;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pathname = req.nextUrl.pathname;
                    console.log("[middleware] request", pathname);
                    return [4 /*yield*/, (0, jwt_1.getToken)({
                            req: req,
                            secret: secret_1.authSecret,
                        })];
                case 1:
                    token = (_b.sent());
                    role = (_a = token === null || token === void 0 ? void 0 : token.role) !== null && _a !== void 0 ? _a : null;
                    console.log("[middleware] role", role);
                    /* Skip static assets, auth endpoints, and login/signup pages */
                    if (pathname.startsWith("/_next") ||
                        pathname.startsWith("/api/auth") ||
                        pathname === "/login" ||
                        pathname === "/signup" ||
                        pathname === "/favicon.ico") {
                        console.log("[middleware] skip", pathname);
                        return [2 /*return*/, server_1.NextResponse.next()];
                    }
                    /* Redirect unauthenticated users to /login */
                    if (!role) {
                        url = req.nextUrl.clone();
                        url.pathname = "/login";
                        url.searchParams.set("callbackUrl", pathname);
                        console.log("[middleware] redirect to login", url.toString());
                        return [2 /*return*/, server_1.NextResponse.redirect(url)];
                    }
                    /* Enforce read access for CMS routes */
                    if (pathname.startsWith("/cms") && !(0, _auth_1.canRead)(role)) {
                        matchShop = /\/cms\/([^/]+)/.exec(pathname);
                        url = new URL("/403", req.url);
                        if (matchShop)
                            url.searchParams.set("shop", matchShop[1]);
                        console.log("[middleware] forbidden", url.toString());
                        return [2 /*return*/, server_1.NextResponse.rewrite(url, { status: 403 })];
                    }
                    match = ADMIN_PATH_REGEX.exec(pathname);
                    if (!(0, _auth_1.canWrite)(role) && match) {
                        url = new URL("/403", req.url);
                        url.searchParams.set("shop", match[1]);
                        console.log("[middleware] viewer blocked", url.toString());
                        return [2 /*return*/, server_1.NextResponse.rewrite(url, { status: 403 })];
                    }
                    console.log("[middleware] allow", pathname);
                    return [2 /*return*/, server_1.NextResponse.next()];
            }
        });
    });
}
exports.config = {
    matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
