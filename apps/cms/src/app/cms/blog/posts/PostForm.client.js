// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
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
exports.default = PostForm;
var react_dom_1 = require("react-dom");
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var _ui_1 = require("@ui");
var shared_utils_1 = require("@acme/shared-utils");
var react_2 = require("@portabletext/react");
var schema_1 = require("./schema");
var invalidProductContext_1 = require("./invalidProductContext");
var MainImageField_1 = require("./MainImageField");
var RichTextEditor_1 = require("./RichTextEditor");
function PostFormContent(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g, _h;
    var action = _a.action, submitLabel = _a.submitLabel, post = _a.post;
    var _j = (0, react_dom_1.useFormState)(action, { message: "", error: "" }), state = _j[0], formAction = _j[1];
    var _k = (0, react_1.useState)((_b = post === null || post === void 0 ? void 0 : post.title) !== null && _b !== void 0 ? _b : ""), title = _k[0], setTitle = _k[1];
    var _l = (0, react_1.useState)((_c = post === null || post === void 0 ? void 0 : post.slug) !== null && _c !== void 0 ? _c : ""), slug = _l[0], setSlug = _l[1];
    var _m = (0, react_1.useState)(false), editSlug = _m[0], setEditSlug = _m[1];
    (0, react_1.useEffect)(function () {
        if (!editSlug)
            setSlug((0, shared_utils_1.slugify)(title));
    }, [title, editSlug]);
    var searchParams = (0, navigation_1.useSearchParams)();
    var shopId = (_d = searchParams.get("shopId")) !== null && _d !== void 0 ? _d : "";
    var _o = (0, react_1.useState)(false), checkingSlug = _o[0], setCheckingSlug = _o[1];
    var _p = (0, react_1.useState)(null), slugError = _p[0], setSlugError = _p[1];
    var slugId = post === null || post === void 0 ? void 0 : post._id;
    (0, react_1.useEffect)(function () {
        if (!slug || !shopId) {
            setSlugError(null);
            return;
        }
        var handle = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var params, res, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setCheckingSlug(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        params = new URLSearchParams({ slug: slug, shopId: shopId });
                        if (slugId)
                            params.append("exclude", slugId);
                        return [4 /*yield*/, fetch("/api/blog/slug?".concat(params.toString()))];
                    case 2:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _b.sent();
                        if (data.exists) {
                            setSlugError("Slug already exists");
                        }
                        else {
                            setSlugError(null);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        setSlugError("Failed to check slug");
                        _b.label = 5;
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        _a = _b.sent();
                        setSlugError("Failed to check slug");
                        return [3 /*break*/, 8];
                    case 7:
                        setCheckingSlug(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); }, 300);
        return function () { return clearTimeout(handle); };
    }, [slug, shopId, slugId]);
    var _q = (0, react_1.useState)((post === null || post === void 0 ? void 0 : post.publishedAt) ? post.publishedAt.slice(0, 16) : ""), publishedAt = _q[0], setPublishedAt = _q[1];
    var _r = (0, react_1.useState)((_e = post === null || post === void 0 ? void 0 : post.mainImage) !== null && _e !== void 0 ? _e : ""), mainImage = _r[0], setMainImage = _r[1];
    var _s = (0, react_1.useState)(Array.isArray(post === null || post === void 0 ? void 0 : post.body)
        ? post === null || post === void 0 ? void 0 : post.body
        : typeof (post === null || post === void 0 ? void 0 : post.body) === "string"
            ? JSON.parse(post.body)
            : []), content = _s[0], setContent = _s[1];
    var invalidProducts = (0, invalidProductContext_1.useInvalidProductContext)().invalidProducts;
    var hasInvalidProducts = Object.keys(invalidProducts).length > 0;
    return (<div className="space-y-4">
      <form action={formAction} className="space-y-4 max-w-xl">
        <_ui_1.Input name="title" label="Title" value={title} onChange={function (e) { return setTitle(e.target.value); }} required/>
        <div className="space-y-2">
          <_ui_1.Input name="slug" label="Slug" value={slug} onChange={function (e) { return setSlug(e.target.value); }} disabled={!editSlug} required error={slugError !== null && slugError !== void 0 ? slugError : undefined}/>
          <div className="flex items-center gap-2">
            <_ui_1.Switch id="edit-slug" checked={editSlug} onChange={function (e) { return setEditSlug(e.target.checked); }}/>
            <label htmlFor="edit-slug">Edit slug</label>
          </div>
        </div>
        <_ui_1.Textarea name="excerpt" label="Excerpt" defaultValue={(_f = post === null || post === void 0 ? void 0 : post.excerpt) !== null && _f !== void 0 ? _f : ""}/>
        <MainImageField_1.default value={mainImage} onChange={setMainImage}/>
        <input type="hidden" name="mainImage" value={mainImage}/>
        <_ui_1.Input name="author" label="Author" defaultValue={(_g = post === null || post === void 0 ? void 0 : post.author) !== null && _g !== void 0 ? _g : ""}/>
        <_ui_1.Input name="categories" label="Categories (comma separated)" defaultValue={((_h = post === null || post === void 0 ? void 0 : post.categories) !== null && _h !== void 0 ? _h : []).join(", ")}/>
        <_ui_1.Input type="datetime-local" name="publishedAt" label="Publish at" value={publishedAt} onChange={function (e) { return setPublishedAt(e.target.value); }}/>
        <div className="space-y-2">
          <RichTextEditor_1.default value={content} onChange={setContent}/>
        </div>
        <input type="hidden" name="content" value={JSON.stringify(content)}/>
        {(post === null || post === void 0 ? void 0 : post._id) && <input type="hidden" name="id" value={post._id}/>}
        {hasInvalidProducts && (<div className="text-red-500">
            Product not found: {Object.values(invalidProducts).join(", ")}
          </div>)}
        <_ui_1.Button type="submit" disabled={checkingSlug || Boolean(slugError) || hasInvalidProducts}>
          {submitLabel}
        </_ui_1.Button>
      </form>
      <input type="hidden" name="publishedAt" form="publish-form" value={publishedAt}/>
      <_ui_1.Toast open={Boolean(state.message || state.error)} message={state.message || state.error || ""}/>
      <div className="space-y-2">
        <h2 className="font-semibold">Preview</h2>
        <div className="prose max-w-none rounded border p-4">
          <react_2.PortableText value={content} components={schema_1.previewComponents}/>
        </div>
      </div>
    </div>);
}
function PostForm(props) {
    return (<invalidProductContext_1.InvalidProductProvider>
      <PostFormContent {...props}/>
    </invalidProductContext_1.InvalidProductProvider>);
}
