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
exports.dynamic = exports.revalidate = void 0;
exports.default = PreviewView;
var HeroBanner_client_1 = require("@/components/home/HeroBanner.client");
var ReviewsCarousel_1 = require("@/components/home/ReviewsCarousel");
var ValueProps_1 = require("@/components/home/ValueProps");
var organisms_1 = require("@/components/organisms");
var AppShell_1 = require("@/components/templates/AppShell");
var locales_1 = require("@i18n/locales");
var Translations_1 = require("@i18n/Translations");
var base_1 = require("@themes/base");
var headers_1 = require("next/headers");
exports.revalidate = 0;
exports.dynamic = "force-dynamic";
var baseTokens = Object.fromEntries(Object.entries(base_1.tokens).map(function (_a) {
    var k = _a[0], v = _a[1];
    return [k, v.light];
}));
function loadThemeTokens(theme) {
    return __awaiter(this, void 0, void 0, function () {
        var mod, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (theme === "base")
                        return [2 /*return*/, baseTokens];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.resolve("".concat(
                        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
                        "@themes/".concat(theme, "/tailwind-tokens"))).then(function (s) { return require(s); })];
                case 2:
                    mod = _b.sent();
                    return [2 /*return*/, mod.tokens];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, baseTokens];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function PreviewView(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sp, dm, theme, lang, tokens, style, messagesMap, messages;
        var searchParams = _b.searchParams;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, searchParams];
                case 1:
                    sp = _c.sent();
                    return [4 /*yield*/, (0, headers_1.draftMode)()];
                case 2:
                    dm = _c.sent();
                    if (!dm.isEnabled) {
                        dm.enable();
                    }
                    theme = typeof sp.theme === "string" ? sp.theme : "base";
                    lang = (0, locales_1.resolveLocale)(typeof sp.lang === "string" ? sp.lang : "en");
                    return [4 /*yield*/, loadThemeTokens(theme)];
                case 3:
                    tokens = _c.sent();
                    style = Object.fromEntries(Object.entries(tokens));
                    messagesMap = {
                        en: function () { return Promise.resolve().then(function () { return require("@i18n/en.json"); }); },
                        de: function () { return Promise.resolve().then(function () { return require("@i18n/de.json"); }); },
                        it: function () { return Promise.resolve().then(function () { return require("@i18n/it.json"); }); },
                    };
                    return [4 /*yield*/, messagesMap[lang]()];
                case 4:
                    messages = (_c.sent()).default;
                    return [2 /*return*/, (<div style={style} className="min-h-screen">
      <Translations_1.default messages={messages}>
        <AppShell_1.AppShell header={<organisms_1.Header locale={lang}/>} sideNav={<organisms_1.SideNav />} footer={<organisms_1.Footer />}>
          <HeroBanner_client_1.default />
          <ValueProps_1.ValueProps />
          <ReviewsCarousel_1.default />
        </AppShell_1.AppShell>
      </Translations_1.default>
    </div>)];
            }
        });
    });
}
