"use strict";
// apps/cms/src/app/cms/blog/posts/page.tsx
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
exports.default = BlogPostsPage;
var link_1 = require("next/link");
var _ui_1 = require("@ui");
var blog_server_1 = require("@cms/actions/blog.server");
var shops_1 = require("@platform-core/src/shops");
var shop_server_1 = require("@platform-core/src/repositories/shop.server");
function BlogPostsPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var shopId, shop, sanity, posts;
        var searchParams = _b.searchParams;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    shopId = searchParams === null || searchParams === void 0 ? void 0 : searchParams.shopId;
                    if (!shopId)
                        return [2 /*return*/, <p>No shop selected.</p>];
                    return [4 /*yield*/, (0, shop_server_1.getShopById)(shopId)];
                case 1:
                    shop = _c.sent();
                    sanity = (0, shops_1.getSanityConfig)(shop);
                    if (!sanity) {
                        return [2 /*return*/, (<p>
        Sanity is not connected.{" "}
        <link_1.default href={"/cms/blog/sanity/connect?shopId=".concat(shopId)} className="text-primary underline">
          Connect Sanity
        </link_1.default>
      </p>)];
                    }
                    return [4 /*yield*/, (0, blog_server_1.getPosts)(shopId)];
                case 2:
                    posts = _c.sent();
                    return [2 /*return*/, (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog Posts</h1>
        <_ui_1.Button asChild>
          <link_1.default href={"/cms/blog/posts/new?shopId=".concat(shopId)}>New Post</link_1.default>
        </_ui_1.Button>
      </div>
      <ul className="space-y-2">
        {posts.map(function (post) {
                                var status = post.publishedAt && new Date(post.publishedAt) > new Date()
                                    ? "scheduled for ".concat(new Date(post.publishedAt).toLocaleString())
                                    : post.published
                                        ? "published"
                                        : "draft";
                                return (<li key={post._id}>
              <link_1.default href={"/cms/blog/posts/".concat(post._id, "?shopId=").concat(shopId)} className="text-primary underline">
                {post.title || "(untitled)"}
              </link_1.default>
              <span className="ml-2 text-sm text-muted-foreground">
                {status}
              </span>
            </li>);
                            })}
        {posts.length === 0 && <li>No posts found.</li>}
      </ul>
    </div>)];
            }
        });
    });
}
