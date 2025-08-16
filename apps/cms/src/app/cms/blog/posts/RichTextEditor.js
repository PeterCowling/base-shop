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
exports.default = RichTextEditor;
var react_1 = require("react");
var _ui_1 = require("@ui");
var editor_1 = require("@portabletext/editor");
var plugins_1 = require("@portabletext/editor/plugins");
var schema_1 = require("./schema");
function Toolbar() {
    var editor = (0, editor_1.useEditor)();
    var addLink = function () {
        var href = prompt("URL");
        if (!href)
            return;
        if (editor_1.PortableTextEditor.isAnnotationActive(editor, "link")) {
            editor_1.PortableTextEditor.removeAnnotation(editor, "link");
        }
        editor_1.PortableTextEditor.addAnnotation(editor, "link", { href: href });
    };
    var addEmbed = function () {
        var url = prompt("Embed URL");
        if (url)
            editor_1.PortableTextEditor.insertBlock(editor, "embed", { url: url });
    };
    var addImage = (0, react_1.useCallback)(function (url) {
        editor_1.PortableTextEditor.insertBlock(editor, "image", { url: url });
    }, [editor]);
    return (<div className="flex flex-wrap gap-2">
      <_ui_1.Button type="button" variant="outline" onClick={function () { return editor_1.PortableTextEditor.toggleMark(editor, "strong"); }}>
        Bold
      </_ui_1.Button>
      <_ui_1.Button type="button" variant="outline" onClick={function () { return editor_1.PortableTextEditor.toggleMark(editor, "em"); }}>
        Italic
      </_ui_1.Button>
      <_ui_1.Button type="button" variant="outline" onClick={function () { return editor_1.PortableTextEditor.toggleBlockStyle(editor, "h1"); }}>
        H1
      </_ui_1.Button>
      <_ui_1.Button type="button" variant="outline" onClick={function () { return editor_1.PortableTextEditor.toggleBlockStyle(editor, "h2"); }}>
        H2
      </_ui_1.Button>
      <_ui_1.Button type="button" variant="outline" onClick={addLink}>
        Link
      </_ui_1.Button>
      <_ui_1.Button type="button" variant="outline" onClick={addEmbed}>
        Embed
      </_ui_1.Button>
      <_ui_1.ImagePicker onSelect={addImage}>
        <_ui_1.Button type="button" variant="outline">
          Image
        </_ui_1.Button>
      </_ui_1.ImagePicker>
    </div>);
}
function ProductSearch(_a) {
    var _this = this;
    var query = _a.query, setQuery = _a.setQuery;
    var editor = (0, editor_1.useEditor)();
    var _b = (0, react_1.useState)([]), matches = _b[0], setMatches = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    (0, react_1.useEffect)(function () {
        if (!query) {
            setMatches([]);
            setError(null);
            return;
        }
        var handle = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("/api/products?q=".concat(encodeURIComponent(query)))];
                    case 2:
                        res = _b.sent();
                        if (!res.ok)
                            throw new Error("Failed to load products");
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _b.sent();
                        setMatches(data);
                        setError(null);
                        return [3 /*break*/, 6];
                    case 4:
                        _a = _b.sent();
                        setError("Failed to load products");
                        return [3 /*break*/, 6];
                    case 5:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); }, 300);
        return function () { return clearTimeout(handle); };
    }, [query]);
    return (<div className="space-y-1">
      <_ui_1.Input label="Search products" value={query} onChange={function (e) { return setQuery(e.target.value); }}/>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-500">{error}</div>}
      {query && !loading && !error && (<ul className="space-y-1">
          {matches.map(function (p) { return (<li key={p.slug}>
              <_ui_1.Button type="button" variant="outline" className="flex items-center gap-2" onClick={function () {
                    return editor_1.PortableTextEditor.insertBlock(editor, "productReference", {
                        slug: p.slug,
                    });
                }}>
                {p.image && (<img src={p.image} alt={p.title} className="h-8 w-8 object-cover"/>)}
                <span className="flex-1 text-left">{p.title}</span>
                <span className="text-sm">{(p.price / 100).toFixed(2)}</span>
              </_ui_1.Button>
            </li>); })}
        </ul>)}
    </div>);
}
function RichTextEditor(_a) {
    var value = _a.value, onChange = _a.onChange;
    var _b = (0, react_1.useState)(""), query = _b[0], setQuery = _b[1];
    return (<editor_1.EditorProvider initialConfig={{ schemaDefinition: schema_1.schema, initialValue: value }}>
      <plugins_1.EventListenerPlugin on={function (event) {
            if (event.type === "mutation") {
                onChange(event.value);
            }
        }}/>
      <Toolbar />
      <editor_1.PortableTextEditable className="min-h-[200px] rounded border p-2" renderBlock={schema_1.renderBlock}/>
      <ProductSearch query={query} setQuery={setQuery}/>
    </editor_1.EditorProvider>);
}
