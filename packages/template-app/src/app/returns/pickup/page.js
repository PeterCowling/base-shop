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
exports.default = PickupPage;
var returnLogistics_1 = require("@platform-core/returnLogistics");
var settings_server_1 = require("@platform-core/repositories/settings.server");
var SHOP_ID = "bcd";
var CleaningInfo_1 = require("../../../components/CleaningInfo");
var shop_json_1 = require("../../../../shop.json");
exports.metadata = { title: "Schedule pickup" };
function PickupPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, info, settings, allowed, zip, isAllowed;
        var _d;
        var searchParams = _b.searchParams;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        (0, returnLogistics_1.getReturnBagAndLabel)(),
                        (0, settings_server_1.getShopSettings)(SHOP_ID),
                    ])];
                case 1:
                    _c = _e.sent(), info = _c[0], settings = _c[1];
                    allowed = ((_d = settings.returnService) === null || _d === void 0 ? void 0 : _d.homePickupEnabled)
                        ? info.homePickupZipCodes
                        : [];
                    zip = (searchParams === null || searchParams === void 0 ? void 0 : searchParams.zip) || "";
                    isAllowed = zip ? allowed.includes(zip) : false;
                    return [2 /*return*/, (<div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Schedule Home Pickup</h1>
      {zip ? (isAllowed ? (<p>Your pickup has been scheduled for ZIP {zip}.</p>) : (<p>Sorry, home pickup is not available in your area.</p>)) : (<form className="space-x-2">
          <input name="zip" placeholder="ZIP code" className="border p-2"/>
          <button type="submit" className="px-4 py-2 bg-primary text-white">
            Check
          </button>
        </form>)}
      {shop_json_1.default.showCleaningTransparency && <CleaningInfo_1.default />}
    </div>)];
            }
        });
    });
}
