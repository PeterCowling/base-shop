"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GET = GET;
exports.POST = POST;
var server_1 = require("next/server");
var email_1 = require("@acme/email");
var analytics_server_1 = require("@platform-core/repositories/analytics.server");
function GET(req) {
    return __awaiter(this, void 0, void 0, function () {
        var shop, campaigns, events, withMetrics;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shop = req.nextUrl.searchParams.get("shop");
                    if (!shop)
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing shop" }, { status: 400 })];
                    return [4 /*yield*/, (0, email_1.listCampaigns)(shop)];
                case 1:
                    campaigns = _a.sent();
                    return [4 /*yield*/, (0, analytics_server_1.listEvents)(shop)];
                case 2:
                    events = _a.sent();
                    withMetrics = campaigns.map(function (c) {
                        var metrics = { sent: 0, opened: 0, clicked: 0 };
                        for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
                            var e = events_1[_i];
                            if (e.campaign !== c.id)
                                continue;
                            if (e.type === "email_sent")
                                metrics.sent += 1;
                            else if (e.type === "email_open")
                                metrics.opened += 1;
                            else if (e.type === "email_click")
                                metrics.clicked += 1;
                        }
                        return __assign(__assign({}, c), { metrics: metrics });
                    });
                    return [2 /*return*/, server_1.NextResponse.json({ campaigns: withMetrics })];
            }
        });
    });
}
function POST(req) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, shop, recipients, to, subject, body, segment, sendAt, templateId, list, html, id, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, req
                        .json()
                        .catch(function () { return ({}); })];
                case 1:
                    _a = (_c.sent()), shop = _a.shop, recipients = _a.recipients, to = _a.to, subject = _a.subject, body = _a.body, segment = _a.segment, sendAt = _a.sendAt, templateId = _a.templateId;
                    list = Array.isArray(recipients) ? recipients : to ? [to] : [];
                    if (!shop || !subject || !body || (list.length === 0 && !segment)) {
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Missing fields" }, { status: 400 })];
                    }
                    html = body;
                    if (templateId) {
                        html = (0, email_1.renderTemplate)(templateId, { subject: subject, body: body });
                    }
                    else {
                        html = "".concat(body, "<p>%%UNSUBSCRIBE%%</p>");
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, email_1.createCampaign)({
                            shop: shop,
                            recipients: list,
                            subject: subject,
                            body: html,
                            segment: segment,
                            sendAt: sendAt,
                            templateId: templateId,
                        })];
                case 3:
                    id = _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ ok: true, id: id })];
                case 4:
                    _b = _c.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Failed to send" }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
