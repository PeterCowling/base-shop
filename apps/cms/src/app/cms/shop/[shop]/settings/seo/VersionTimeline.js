// apps/cms/src/app/cms/shop/[shop]/settings/seo/VersionTimeline.tsx
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VersionTimeline;
var shadcn_1 = require("@/components/atoms/shadcn");
var shops_server_1 = require("@cms/actions/shops.server");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var date_utils_1 = require("@acme/date-utils");
var react_1 = require("react");
/**
 * Drawer that lists past settings changes and lets an admin revert
 * the shop settings back to a previous state.
 */
function VersionTimeline(_a) {
    var shop = _a.shop, trigger = _a.trigger;
    var _b = (0, react_1.useState)(false), open = _b[0], setOpen = _b[1];
    var _c = (0, react_1.useState)([]), history = _c[0], setHistory = _c[1];
    /** Fetch history when drawer opens */
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        (0, settings_server_1.diffHistory)(shop)
            .then(setHistory)
            .catch(function () { return setHistory([]); });
    }, [open, shop]);
    /** Revert to a specific timestamp and then refresh history */
    function handleRevert(timestamp) {
        return __awaiter(this, void 0, void 0, function () {
            var next;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, shops_server_1.revertSeo)(shop, timestamp)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, settings_server_1.diffHistory)(shop)];
                    case 2:
                        next = _a.sent();
                        setHistory(next);
                        return [2 /*return*/];
                }
            });
        });
    }
    /** Oldest first ‑ ensures the first “Revert” button is the oldest diff */
    var ordered = __spreadArray([], history, true).sort(function (a, b) {
        return a.timestamp.localeCompare(b.timestamp);
    });
    return (<shadcn_1.Dialog open={open} onOpenChange={setOpen}>
      <shadcn_1.DialogTrigger asChild>{trigger}</shadcn_1.DialogTrigger>
      <shadcn_1.DialogContent className="bg-background fixed top-0 right-0 h-full w-96 max-w-full translate-x-full overflow-y-auto border-l p-6 shadow-lg transition-transform data-[state=open]:translate-x-0">
        <shadcn_1.DialogTitle className="mb-4">Revision History</shadcn_1.DialogTitle>

        <div className="space-y-4 text-sm">
          {ordered.length === 0 ? (<p className="text-muted-foreground">No history available.</p>) : (<ul className="space-y-4">
              {ordered.map(function (entry) { return (<li key={entry.timestamp} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-mono text-xs">
                      {(0, date_utils_1.formatTimestamp)(entry.timestamp)}
                    </span>
                    <shadcn_1.Button variant="outline" onClick={function () { return handleRevert(entry.timestamp); }}>
                      Revert
                    </shadcn_1.Button>
                  </div>
                  <pre className="bg-muted overflow-auto rounded p-2 text-xs">
                    {JSON.stringify(entry.diff, null, 2)}
                  </pre>
                </li>); })}
            </ul>)}
        </div>
      </shadcn_1.DialogContent>
    </shadcn_1.Dialog>);
}
