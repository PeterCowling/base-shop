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
exports.generateMeta = generateMeta;
var openai_1 = require("openai");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var config_1 = require("@acme/config");
/**
 * Generate metadata for a product using an LLM and image model.
 * Requires OPENAI_API_KEY to be set. Generated images are written to
 * `public/og/<id>.png` and the returned `image` field is the public path.
 */
function generateMeta(product) {
    return __awaiter(this, void 0, void 0, function () {
        var client, prompt, text, data, output, content, img, b64, buffer, file;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    client = new openai_1.default({ apiKey: config_1.env.OPENAI_API_KEY });
                    prompt = "Generate SEO metadata for a product as JSON with keys title, description, alt.\n\nTitle: ".concat(product.title, "\nDescription: ").concat(product.description);
                    return [4 /*yield*/, client.responses.create({
                            model: "gpt-4o-mini",
                            input: prompt,
                        })];
                case 1:
                    text = _f.sent();
                    data = {
                        title: product.title,
                        description: product.description,
                        alt: product.title,
                    };
                    try {
                        output = (_c = (_b = (_a = text.output) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c[0];
                        content = typeof output === "string" ? output : output === null || output === void 0 ? void 0 : output.text;
                        if (content) {
                            data = JSON.parse(content);
                        }
                    }
                    catch (_g) {
                        // fall back to defaults
                    }
                    return [4 /*yield*/, client.images.generate({
                            model: "gpt-image-1",
                            prompt: "Generate a 1200x630 social media share image for ".concat(product.title),
                            size: "1200x630",
                        })];
                case 2:
                    img = _f.sent();
                    b64 = (_e = (_d = img.data[0]) === null || _d === void 0 ? void 0 : _d.b64_json) !== null && _e !== void 0 ? _e : "";
                    buffer = Buffer.from(b64, "base64");
                    file = node_path_1.default.join(process.cwd(), "public", "og", "".concat(product.id, ".png"));
                    return [4 /*yield*/, node_fs_1.promises.mkdir(node_path_1.default.dirname(file), { recursive: true })];
                case 3:
                    _f.sent();
                    return [4 /*yield*/, node_fs_1.promises.writeFile(file, buffer)];
                case 4:
                    _f.sent();
                    return [2 /*return*/, {
                            title: data.title,
                            description: data.description,
                            alt: data.alt,
                            image: "/og/".concat(product.id, ".png"),
                        }];
            }
        });
    });
}
// CLI usage: tsx scripts/generate-meta.ts path/to/product.json
if (process.argv[1] && process.argv[1].endsWith("generate-meta.ts")) {
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var input, raw, product, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    input = process.argv[2];
                    if (!input) {
                        console.error("Usage: generate-meta.ts <product.json>");
                        process.exit(1);
                    }
                    return [4 /*yield*/, node_fs_1.promises.readFile(input, "utf8")];
                case 1:
                    raw = _a.sent();
                    product = JSON.parse(raw);
                    return [4 /*yield*/, generateMeta(product)];
                case 2:
                    result = _a.sent();
                    // eslint-disable-next-line no-console
                    console.log(JSON.stringify(result, null, 2));
                    return [2 /*return*/];
            }
        });
    }); })();
}
