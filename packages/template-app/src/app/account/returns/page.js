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
exports.metadata = void 0;
exports.default = ReturnsPage;
var returnLogistics_1 = require("@platform-core/returnLogistics");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var react_1 = require("react");
var SHOP_ID = "bcd";
var CleaningInfo_1 = require("../../../components/CleaningInfo");
var shop_json_1 = require("../../../../shop.json");
exports.metadata = { title: "Mobile Returns" };
function ReturnsPage() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, cfg, info, settings, bagType, tracking;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        (0, returnLogistics_1.getReturnLogistics)(),
                        (0, returnLogistics_1.getReturnBagAndLabel)(),
                        (0, settings_server_1.getShopSettings)(SHOP_ID),
                    ])];
                case 1:
                    _a = _c.sent(), cfg = _a[0], info = _a[1], settings = _a[2];
                    if (!cfg.mobileApp) {
                        return [2 /*return*/, <p className="p-6">Mobile returns are not enabled.</p>];
                    }
                    bagType = ((_b = settings.returnService) === null || _b === void 0 ? void 0 : _b.bagEnabled) ? info.bagType : undefined;
                    tracking = info.tracking;
                    return [2 /*return*/, (<>
      <ReturnForm bagType={bagType} tracking={tracking}/>
      {shop_json_1.default.showCleaningTransparency && <CleaningInfo_1.default />}
    </>)];
            }
        });
    });
}
function ReturnForm(_a) {
    "use client";
    var _this = this;
    var bagType = _a.bagType, trackingEnabled = _a.tracking;
    var videoRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(""), sessionId = _b[0], setSessionId = _b[1];
    var _c = (0, react_1.useState)(null), labelUrl = _c[0], setLabelUrl = _c[1];
    var _d = (0, react_1.useState)(null), trackingNumber = _d[0], setTrackingNumber = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    (0, react_1.useEffect)(function () {
        var stream = null;
        var active = true;
        function init() {
            return __awaiter(this, void 0, void 0, function () {
                var detector_1, scan_1, _a;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!("BarcodeDetector" in window))
                                return [2 /*return*/];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                    video: { facingMode: "environment" },
                                })];
                        case 2:
                            stream = _b.sent();
                            if (!videoRef.current) return [3 /*break*/, 4];
                            videoRef.current.srcObject = stream;
                            return [4 /*yield*/, videoRef.current.play()];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            detector_1 = new window.BarcodeDetector({
                                formats: ["qr_code"],
                            });
                            scan_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                var codes, code, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!active || !videoRef.current)
                                                return [2 /*return*/];
                                            _b.label = 1;
                                        case 1:
                                            _b.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, detector_1.detect(videoRef.current)];
                                        case 2:
                                            codes = _b.sent();
                                            if (codes.length > 0) {
                                                code = codes[0].rawValue;
                                                setSessionId(code);
                                                active = false;
                                                stream === null || stream === void 0 ? void 0 : stream.getTracks().forEach(function (t) { return t.stop(); });
                                                return [2 /*return*/];
                                            }
                                            return [3 /*break*/, 4];
                                        case 3:
                                            _a = _b.sent();
                                            return [3 /*break*/, 4];
                                        case 4:
                                            requestAnimationFrame(scan_1);
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            requestAnimationFrame(scan_1);
                            return [3 /*break*/, 6];
                        case 5:
                            _a = _b.sent();
                            setError("Unable to access camera.");
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        init();
        return function () {
            active = false;
            stream === null || stream === void 0 ? void 0 : stream.getTracks().forEach(function (t) { return t.stop(); });
        };
    }, []);
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var res, data, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    setLabelUrl(null);
                    setTrackingNumber(null);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/returns/mobile", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId: sessionId }),
                        })];
                case 2:
                    res = _d.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _d.sent();
                    if (!res.ok) {
                        setError(data.error || "Failed to create return");
                        return [2 /*return*/];
                    }
                    setLabelUrl((_b = data.labelUrl) !== null && _b !== void 0 ? _b : null);
                    setTrackingNumber((_c = data.tracking) !== null && _c !== void 0 ? _c : null);
                    return [3 /*break*/, 5];
                case 4:
                    _a = _d.sent();
                    setError("Failed to create return");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Return Item</h1>
      {bagType && <p>Please reuse the {bagType} bag for your return.</p>}
      <video ref={videoRef} className="w-full max-w-md"/>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input className="w-full border p-2" placeholder="Session ID" value={sessionId} onChange={function (e) { return setSessionId(e.target.value); }}/>
        <button type="submit" className="bg-primary px-4 py-2 text-white">
          Submit
        </button>
      </form>
      {labelUrl && trackingEnabled && (<p>
          <a href={labelUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
            Print Label
          </a>
          {trackingNumber && (<span className="block">Tracking: {trackingNumber}</span>)}
        </p>)}
      {error && <p className="text-red-600">{error}</p>}
    </div>);
}
