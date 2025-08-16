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
exports.default = StepHosting;
var shadcn_1 = require("@/components/atoms/shadcn");
var react_1 = require("react");
var deployShop_1 = require("../services/deployShop");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
function StepHosting(_a) {
    var _this = this;
    var shopId = _a.shopId, domain = _a.domain, setDomain = _a.setDomain, deployResult = _a.deployResult, deployInfo = _a.deployInfo, setDeployInfo = _a.setDeployInfo, deploying = _a.deploying, deploy = _a.deploy;
    var _b = (0, useStepCompletion_1.default)("hosting"), markComplete = _b[1];
    var router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(function () {
        if (!shopId || !deployInfo)
            return;
        if (deployInfo.status !== "pending" &&
            deployInfo.domainStatus !== "pending") {
            return;
        }
        var timer;
        var poll = function () { return __awaiter(_this, void 0, void 0, function () {
            var status_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, deployShop_1.getDeployStatus)(shopId)];
                    case 1:
                        status_1 = _b.sent();
                        setDeployInfo(status_1);
                        if (status_1.status === "pending" ||
                            status_1.domainStatus === "pending") {
                            timer = setTimeout(poll, 5000);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        timer = setTimeout(poll, 5000);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        poll();
        return function () { return clearTimeout(timer); };
    }, [shopId, deployInfo, setDeployInfo]);
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Hosting</h2>
      <label className="flex flex-col gap-1">
        <span>Custom Domain</span>
        <shadcn_1.Input value={domain} onChange={function (e) { return setDomain(e.target.value); }} placeholder="myshop.example.com"/>
      </label>
      {deployResult && <p className="text-sm">{deployResult}</p>}
      {(deployInfo === null || deployInfo === void 0 ? void 0 : deployInfo.previewUrl) && (<p className="text-sm">
          Preview:{" "}
          <a href={deployInfo.previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            {deployInfo.previewUrl}
          </a>
        </p>)}
      {(deployInfo === null || deployInfo === void 0 ? void 0 : deployInfo.instructions) && (<p className="text-sm">{deployInfo.instructions}</p>)}
      {(deployInfo === null || deployInfo === void 0 ? void 0 : deployInfo.domainStatus) === "pending" && (<p className="text-sm">Waiting for domain verification…</p>)}
      {(deployInfo === null || deployInfo === void 0 ? void 0 : deployInfo.status) === "success" && (<p className="text-sm text-green-600">Deployment complete</p>)}
      {(deployInfo === null || deployInfo === void 0 ? void 0 : deployInfo.status) === "error" && deployInfo.error && (<p className="text-sm text-red-600">{deployInfo.error}</p>)}
      <div className="flex justify-end">
        <shadcn_1.Button disabled={deploying} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, deploy()];
                    case 1:
                        _a.sent();
                        markComplete(true);
                        router.push("/cms/configurator");
                        return [2 /*return*/];
                }
            });
        }); }}>
          {deploying ? "Deploying…" : "Save & return"}
        </shadcn_1.Button>
      </div>
    </div>);
}
