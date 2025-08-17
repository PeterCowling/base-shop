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
exports.default = VerifyPage;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var _shared_utils_1 = require("@shared-utils");
function VerifyPage() {
    var _a = (0, react_1.useState)("Verifying..."), status = _a[0], setStatus = _a[1];
    var params = (0, navigation_1.useSearchParams)();
    (0, react_1.useEffect)(function () {
        var token = params.get("token");
        function verify() {
            return __awaiter(this, void 0, void 0, function () {
                var csrfToken, body, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!token) {
                                setStatus("Missing token");
                                return [2 /*return*/];
                            }
                            csrfToken = (0, _shared_utils_1.getCsrfToken)();
                            body = { token: token };
                            return [4 /*yield*/, fetch("/api/account/verify", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "x-csrf-token": csrfToken !== null && csrfToken !== void 0 ? csrfToken : "",
                                    },
                                    body: JSON.stringify(body),
                                })];
                        case 1:
                            res = _a.sent();
                            setStatus(res.ok ? "Account verified" : "Verification failed");
                            return [2 /*return*/];
                    }
                });
            });
        }
        verify();
    }, [params]);
    return <p>{status}</p>;
}
