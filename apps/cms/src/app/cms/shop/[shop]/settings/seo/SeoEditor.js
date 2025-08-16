"use client";
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
exports.default = SeoEditor;
var shadcn_1 = require("@/components/atoms/shadcn");
var shops_server_1 = require("@cms/actions/shops.server");
var react_1 = require("react");
function SeoEditor(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    var shop = _a.shop, languages = _a.languages, initialSeo = _a.initialSeo, _r = _a.initialFreeze, initialFreeze = _r === void 0 ? false : _r;
    var _s = (0, react_1.useState)(languages[0]), locale = _s[0], setLocale = _s[1];
    var _t = (0, react_1.useState)((_c = (_b = initialSeo[locale]) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : ""), title = _t[0], setTitle = _t[1];
    var _u = (0, react_1.useState)((_e = (_d = initialSeo[locale]) === null || _d === void 0 ? void 0 : _d.description) !== null && _e !== void 0 ? _e : ""), description = _u[0], setDescription = _u[1];
    var _v = (0, react_1.useState)((_g = (_f = initialSeo[locale]) === null || _f === void 0 ? void 0 : _f.image) !== null && _g !== void 0 ? _g : ""), image = _v[0], setImage = _v[1];
    var _w = (0, react_1.useState)((_j = (_h = initialSeo[locale]) === null || _h === void 0 ? void 0 : _h.alt) !== null && _j !== void 0 ? _j : ""), alt = _w[0], setAlt = _w[1];
    var _x = (0, react_1.useState)((_l = (_k = initialSeo[locale]) === null || _k === void 0 ? void 0 : _k.canonicalBase) !== null && _l !== void 0 ? _l : ""), canonicalBase = _x[0], setCanonicalBase = _x[1];
    var _y = (0, react_1.useState)((_o = (_m = initialSeo[locale]) === null || _m === void 0 ? void 0 : _m.ogUrl) !== null && _o !== void 0 ? _o : ""), ogUrl = _y[0], setOgUrl = _y[1];
    var _z = (0, react_1.useState)((_q = (_p = initialSeo[locale]) === null || _p === void 0 ? void 0 : _p.twitterCard) !== null && _q !== void 0 ? _q : ""), twitterCard = _z[0], setTwitterCard = _z[1];
    var _0 = (0, react_1.useState)(false), saving = _0[0], setSaving = _0[1];
    var _1 = (0, react_1.useState)(false), generating = _1[0], setGenerating = _1[1];
    var _2 = (0, react_1.useState)({}), errors = _2[0], setErrors = _2[1];
    var _3 = (0, react_1.useState)([]), warnings = _3[0], setWarnings = _3[1];
    var _4 = (0, react_1.useState)(initialFreeze), freeze = _4[0], setFreeze = _4[1];
    var handleLocaleChange = function (e) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        var l = e.target.value;
        setLocale(l);
        setCanonicalBase((_b = (_a = initialSeo[l]) === null || _a === void 0 ? void 0 : _a.canonicalBase) !== null && _b !== void 0 ? _b : "");
        if (!freeze) {
            setTitle((_d = (_c = initialSeo[l]) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : "");
            setDescription((_f = (_e = initialSeo[l]) === null || _e === void 0 ? void 0 : _e.description) !== null && _f !== void 0 ? _f : "");
            setImage((_h = (_g = initialSeo[l]) === null || _g === void 0 ? void 0 : _g.image) !== null && _h !== void 0 ? _h : "");
            setAlt((_k = (_j = initialSeo[l]) === null || _j === void 0 ? void 0 : _j.alt) !== null && _k !== void 0 ? _k : "");
            setOgUrl((_m = (_l = initialSeo[l]) === null || _l === void 0 ? void 0 : _l.ogUrl) !== null && _m !== void 0 ? _m : "");
            setTwitterCard((_p = (_o = initialSeo[l]) === null || _o === void 0 ? void 0 : _o.twitterCard) !== null && _p !== void 0 ? _p : "");
        }
        setErrors({});
        setWarnings([]);
    };
    var handleFreezeChange = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var checked;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    checked = e.target.checked;
                    setFreeze(checked);
                    return [4 /*yield*/, (0, shops_server_1.setFreezeTranslations)(shop, checked)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var onSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var fd, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    e.preventDefault();
                    setSaving(true);
                    fd = new FormData();
                    fd.append("locale", locale);
                    fd.append("title", title);
                    fd.append("description", description);
                    fd.append("image", image);
                    fd.append("alt", alt);
                    fd.append("canonicalBase", canonicalBase);
                    fd.append("ogUrl", ogUrl);
                    fd.append("twitterCard", twitterCard);
                    return [4 /*yield*/, (0, shops_server_1.updateSeo)(shop, fd)];
                case 1:
                    result = _b.sent();
                    if (result.errors) {
                        setErrors(result.errors);
                    }
                    else {
                        setErrors({});
                        setWarnings((_a = result.warnings) !== null && _a !== void 0 ? _a : []);
                    }
                    setSaving(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleGenerate = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setGenerating(true);
                    return [4 /*yield*/, fetch("/api/seo/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                shop: shop,
                                id: "".concat(shop, "-").concat(locale),
                                title: title,
                                description: description,
                            }),
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = (_a.sent());
                    setTitle(data.title);
                    setDescription(data.description);
                    setAlt(data.alt);
                    setImage(data.image);
                    _a.label = 3;
                case 3:
                    setGenerating(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={onSubmit} className="space-y-4">
      <label className="flex flex-col gap-1">
        <span>Locale</span>
        <select value={locale} onChange={handleLocaleChange} className="border p-2">
          {languages.map(function (l) { return (<option key={l} value={l}>
              {l.toUpperCase()}
            </option>); })}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={freeze} onChange={handleFreezeChange}/>
        <span>Freeze translations</span>
      </label>
      <label className="flex flex-col gap-1">
        <span>Title</span>
        <shadcn_1.Input className="border p-2" value={title} onChange={function (e) { return setTitle(e.target.value); }}/>
      </label>
      <label className="flex flex-col gap-1">
        <span>Description</span>
        <shadcn_1.Textarea rows={3} value={description} onChange={function (e) { return setDescription(e.target.value); }}/>
      </label>
      <label className="flex flex-col gap-1">
        <span>Image URL</span>
        <shadcn_1.Input className="border p-2" value={image} onChange={function (e) { return setImage(e.target.value); }}/>
      </label>
      <label className="flex flex-col gap-1">
        <span>Image Alt</span>
        <shadcn_1.Input className="border p-2" value={alt} onChange={function (e) { return setAlt(e.target.value); }}/>
      </label>
      <label className="flex flex-col gap-1">
        <span>Canonical Base</span>
        <shadcn_1.Input className="border p-2" value={canonicalBase} onChange={function (e) { return setCanonicalBase(e.target.value); }}/>
      </label>
      <label className="flex flex-col gap-1">
        <span>Open Graph URL</span>
        <shadcn_1.Input className="border p-2" value={ogUrl} onChange={function (e) { return setOgUrl(e.target.value); }}/>
      </label>
      <label className="flex flex-col gap-1">
        <span>Twitter Card</span>
        <shadcn_1.Input className="border p-2" value={twitterCard} onChange={function (e) { return setTwitterCard(e.target.value); }}/>
      </label>
      {Object.keys(errors).length > 0 && (<div className="text-sm text-red-600">
          {Object.entries(errors).map(function (_a) {
                var k = _a[0], v = _a[1];
                return (<p key={k}>{v.join("; ")}</p>);
            })}
        </div>)}
        {warnings.length > 0 && (<div className="text-sm text-yellow-700">
            {warnings.map(function (w) { return (<p key={w}>{w}</p>); })}
          </div>)}
        <div className="flex gap-2">
          <shadcn_1.Button className="bg-muted text-primary" type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate metadata"}
          </shadcn_1.Button>
          <shadcn_1.Button className="bg-primary text-white" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </shadcn_1.Button>
        </div>
      </form>);
}
