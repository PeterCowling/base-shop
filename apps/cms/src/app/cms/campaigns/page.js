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
exports.default = CampaignPage;
var react_1 = require("react");
function CampaignPage() {
    var _a = (0, react_1.useState)(""), to = _a[0], setTo = _a[1];
    var _b = (0, react_1.useState)(""), subject = _b[0], setSubject = _b[1];
    var _c = (0, react_1.useState)(""), body = _c[0], setBody = _c[1];
    var _d = (0, react_1.useState)(null), status = _d[0], setStatus = _d[1];
    function send(e) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        setStatus(null);
                        return [4 /*yield*/, fetch("/api/campaigns", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ to: to, subject: subject, body: body }),
                            })];
                    case 1:
                        res = _a.sent();
                        if (res.ok)
                            setStatus("Sent");
                        else
                            setStatus("Failed");
                        return [2 /*return*/];
                }
            });
        });
    }
    return (<form onSubmit={send} className="space-y-2 p-4">
      <input className="border p-2 w-full" placeholder="Recipient" value={to} onChange={function (e) { return setTo(e.target.value); }}/>
      <input className="border p-2 w-full" placeholder="Subject" value={subject} onChange={function (e) { return setSubject(e.target.value); }}/>
      <textarea className="border p-2 w-full h-40" placeholder="HTML body" value={body} onChange={function (e) { return setBody(e.target.value); }}/>
      <button className="border px-4 py-2" type="submit">
        Send
      </button>
      {status && <p>{status}</p>}
    </form>);
}
