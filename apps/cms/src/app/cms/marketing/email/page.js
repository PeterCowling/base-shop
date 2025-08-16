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
exports.default = EmailMarketingPage;
var react_1 = require("react");
var ui_1 = require("@acme/ui");
function EmailMarketingPage() {
    var _a, _b;
    var _c = (0, react_1.useState)(""), shop = _c[0], setShop = _c[1];
    var _d = (0, react_1.useState)(""), recipients = _d[0], setRecipients = _d[1];
    var _e = (0, react_1.useState)(""), segment = _e[0], setSegment = _e[1];
    var _f = (0, react_1.useState)([]), segments = _f[0], setSegments = _f[1];
    var _g = (0, react_1.useState)(""), sendAt = _g[0], setSendAt = _g[1];
    var _h = (0, react_1.useState)(""), subject = _h[0], setSubject = _h[1];
    var _j = (0, react_1.useState)(""), body = _j[0], setBody = _j[1];
    var _k = (0, react_1.useState)(((_a = ui_1.marketingEmailTemplates[0]) === null || _a === void 0 ? void 0 : _a.id) || ""), templateId = _k[0], setTemplateId = _k[1];
    var _l = (0, react_1.useState)(null), status = _l[0], setStatus = _l[1];
    var _m = (0, react_1.useState)([]), campaigns = _m[0], setCampaigns = _m[1];
    function loadCampaigns(s) {
        return __awaiter(this, void 0, void 0, function () {
            var res, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!s)
                            return [2 /*return*/];
                        return [4 /*yield*/, fetch("/api/marketing/email?shop=".concat(encodeURIComponent(s)))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _a.sent();
                        setCampaigns(json.campaigns || []);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    (0, react_1.useEffect)(function () {
        loadCampaigns(shop);
        loadSegments(shop);
    }, [shop]);
    function loadSegments(s) {
        return __awaiter(this, void 0, void 0, function () {
            var res, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!s)
                            return [2 /*return*/];
                        return [4 /*yield*/, fetch("/api/segments?shop=".concat(encodeURIComponent(s)))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _a.sent();
                        setSegments(json.segments || []);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function send(e) {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        setStatus(null);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch("/api/marketing/email", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    shop: shop,
                                    subject: subject,
                                    body: body,
                                    segment: segment,
                                    templateId: templateId,
                                    sendAt: sendAt || undefined,
                                    recipients: recipients
                                        .split(/[,\s]+/)
                                        .map(function (r) { return r.trim(); })
                                        .filter(Boolean),
                                }),
                            })];
                    case 2:
                        res = _b.sent();
                        setStatus(res.ok ? "Queued" : "Failed");
                        if (!res.ok) return [3 /*break*/, 4];
                        setRecipients("");
                        setSegment("");
                        setSendAt("");
                        setSubject("");
                        setBody("");
                        return [4 /*yield*/, loadCampaigns(shop)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        setStatus("Failed");
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="space-y-4 p-4">
      <form onSubmit={send} className="space-y-2">
        <input className="w-full border p-2" placeholder="Shop" value={shop} onChange={function (e) { return setShop(e.target.value); }}/>
        <input className="w-full border p-2" placeholder="Recipients (comma separated)" value={recipients} onChange={function (e) { return setRecipients(e.target.value); }}/>
        <select className="w-full border p-2" value={segment} onChange={function (e) { return setSegment(e.target.value); }}>
          <option value="">Select segment</option>
          {segments.map(function (s) { return (<option key={s.id} value={s.id}>
              {s.name}
            </option>); })}
        </select>
        <input type="datetime-local" className="w-full border p-2" value={sendAt} onChange={function (e) { return setSendAt(e.target.value); }}/>
        <input className="w-full border p-2" placeholder="Subject" value={subject} onChange={function (e) { return setSubject(e.target.value); }}/>
        <select className="w-full border p-2" value={templateId} onChange={function (e) { return setTemplateId(e.target.value); }}>
          {ui_1.marketingEmailTemplates.map(function (t) { return (<option key={t.id} value={t.id}>
              {t.name}
            </option>); })}
        </select>
        <textarea className="h-40 w-full border p-2" placeholder="HTML body" value={body} onChange={function (e) { return setBody(e.target.value); }}/>
        <button className="border px-4 py-2" type="submit">
          Send
        </button>
        {status && <p>{status}</p>}
      </form>
      {campaigns.length > 0 && (<table className="mt-4 w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">Subject</th>
              <th className="border px-2 py-1 text-left">Recipients</th>
              <th className="border px-2 py-1">Send At</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Sent</th>
              <th className="border px-2 py-1">Opened</th>
              <th className="border px-2 py-1">Clicked</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(function (c) { return (<tr key={c.id}>
                <td className="border px-2 py-1">{c.subject}</td>
                <td className="border px-2 py-1">{c.recipients.join(", ")}</td>
                <td className="border px-2 py-1 text-center">
                  {new Date(c.sendAt).toLocaleString()}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.sentAt
                    ? "Sent"
                    : new Date(c.sendAt) > new Date()
                        ? "Scheduled"
                        : "Pending"}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.metrics.sent}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.metrics.opened}
                </td>
                <td className="border px-2 py-1 text-center">
                  {c.metrics.clicked}
                </td>
              </tr>); })}
          </tbody>
        </table>)}
      <div className="mt-4">
        {(_b = ui_1.marketingEmailTemplates
            .find(function (t) { return t.id === templateId; })) === null || _b === void 0 ? void 0 : _b.render({
            headline: subject || "",
            content: (<div dangerouslySetInnerHTML={{
                    __html: body || "<p>Preview content</p>",
                }}/>),
        })}
      </div>
    </div>);
}
