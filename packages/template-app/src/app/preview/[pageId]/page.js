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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PreviewPage;
var navigation_1 = require("next/navigation");
var types_1 = require("@acme/types");
var devicePresets_1 = require("@ui/utils/devicePresets");
var PreviewClient_1 = require("./PreviewClient");
function PreviewPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var pageId, query, res, page, _c, _d, locale, init, initialDeviceId;
        var _e;
        var params = _b.params, searchParams = _b.searchParams;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    pageId = params.pageId;
                    query = new URLSearchParams();
                    if (searchParams.token)
                        query.set("token", searchParams.token);
                    if (searchParams.upgrade)
                        query.set("upgrade", searchParams.upgrade);
                    return [4 /*yield*/, fetch("/preview/".concat(pageId, "?").concat(query.toString()), {
                            cache: "no-store",
                        })];
                case 1:
                    res = _f.sent();
                    if (res.status === 404) {
                        (0, navigation_1.notFound)();
                    }
                    if (res.status === 401) {
                        return [2 /*return*/, new Response("Unauthorized", { status: 401 })];
                    }
                    if (!res.ok) {
                        throw new Error("Failed to load preview");
                    }
                    _d = (_c = types_1.pageSchema).parse;
                    return [4 /*yield*/, res.json()];
                case 2:
                    page = _d.apply(_c, [_f.sent()]);
                    locale = (Object.keys(page.seo.title)[0] || "en");
                    init = (_e = searchParams.device) !== null && _e !== void 0 ? _e : searchParams.view;
                    initialDeviceId = (function () {
                        if (typeof init === "string") {
                            if (["desktop", "tablet", "mobile"].includes(init)) {
                                return (0, devicePresets_1.getLegacyPreset)(init).id;
                            }
                            var match = devicePresets_1.devicePresets.find(function (p) { return p.id === init; });
                            if (match)
                                return match.id;
                        }
                        return devicePresets_1.devicePresets[0].id;
                    })();
                    return [2 /*return*/, (<PreviewClient_1.default components={page.components} locale={locale} initialDeviceId={initialDeviceId}/>)];
            }
        });
    });
}
