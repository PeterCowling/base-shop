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
exports.default = MobileReturnPage;
var returnLogistics_1 = require("@platform-core/returnLogistics");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var SHOP_ID = "bcd";
var CleaningInfo_1 = require("../../../components/CleaningInfo");
var shop_json_1 = require("../../../../shop.json");
var react_1 = require("react");
exports.metadata = { title: "Mobile Returns" };
function MobileReturnPage() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, cfg, info, settings, allowed;
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
                    allowed = ((_b = settings.returnService) === null || _b === void 0 ? void 0 : _b.homePickupEnabled)
                        ? info.homePickupZipCodes
                        : [];
                    return [2 /*return*/, (<>
      <Scanner allowedZips={allowed}/>
      {shop_json_1.default.showCleaningTransparency && <CleaningInfo_1.default />}
    </>)];
            }
        });
    });
}
function Scanner(_a) {
    "use client";
    var allowedZips = _a.allowedZips;
    var videoRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(null), result = _b[0], setResult = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var _d = (0, react_1.useState)(""), zip = _d[0], setZip = _d[1];
    var _e = (0, react_1.useState)(false), done = _e[0], setDone = _e[1];
    function finalize(sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("/api/returns/mobile", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(zip ? { sessionId: sessionId, zip: zip } : { sessionId: sessionId }),
                            })];
                    case 1:
                        _a.sent();
                        setDone(true);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error(err_1);
                        setError("Failed to record return.");
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    (0, react_1.useEffect)(function () {
        var stream = null;
        var active = true;
        function init() {
            return __awaiter(this, void 0, void 0, function () {
                var detector_1, scan_1, err_2;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!("BarcodeDetector" in window)) {
                                setError("Scanning not supported on this device.");
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                    video: { facingMode: "environment" },
                                })];
                        case 2:
                            stream = _a.sent();
                            if (!videoRef.current) return [3 /*break*/, 4];
                            videoRef.current.srcObject = stream;
                            return [4 /*yield*/, videoRef.current.play()];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            detector_1 = new window.BarcodeDetector({
                                formats: ["qr_code", "code_128", "ean_13", "upc_a"],
                            });
                            scan_1 = function () { return __awaiter(_this, void 0, void 0, function () {
                                var codes, code, err_3;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!active || !videoRef.current)
                                                return [2 /*return*/];
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 6, , 7]);
                                            return [4 /*yield*/, detector_1.detect(videoRef.current)];
                                        case 2:
                                            codes = _a.sent();
                                            if (!(codes.length > 0)) return [3 /*break*/, 5];
                                            code = codes[0].rawValue;
                                            setResult(code);
                                            active = false;
                                            stream === null || stream === void 0 ? void 0 : stream.getTracks().forEach(function (t) { return t.stop(); });
                                            if (!(allowedZips.length === 0)) return [3 /*break*/, 4];
                                            return [4 /*yield*/, finalize(code)];
                                        case 3:
                                            _a.sent();
                                            _a.label = 4;
                                        case 4: return [2 /*return*/];
                                        case 5: return [3 /*break*/, 7];
                                        case 6:
                                            err_3 = _a.sent();
                                            console.error(err_3);
                                            return [3 /*break*/, 7];
                                        case 7:
                                            requestAnimationFrame(scan_1);
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            requestAnimationFrame(scan_1);
                            return [3 /*break*/, 6];
                        case 5:
                            err_2 = _a.sent();
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
    }, [allowedZips]);
    if (done) {
        return (<div className="space-y-4 p-6">
        <p>Return recorded.</p>
      </div>);
    }
    return (<div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Scan to mark return</h1>
      {!result && <video ref={videoRef} className="w-full max-w-md"/>}
      {result && allowedZips.length > 0 && (<div className="space-y-2">
          <p>Scanned: {result}</p>
          <label className="flex flex-col gap-1">
            Home pickup ZIP
            <select className="border p-2" value={zip} onChange={function (e) { return setZip(e.target.value); }}>
              <option value="">Select ZIP</option>
              {allowedZips.map(function (z) { return (<option key={z} value={z}>
                  {z}
                </option>); })}
            </select>
          </label>
          <button className="bg-blue-600 px-4 py-2 text-white disabled:opacity-50" disabled={!zip} onClick={function () { return result && finalize(result); }}>
            Finalize
          </button>
        </div>)}
      {result && allowedZips.length === 0 && <p>Processing...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>);
}
