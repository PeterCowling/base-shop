"use client";
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
exports.default = ConfiguratorDashboard;
var react_1 = require("react");
var link_1 = require("next/link");
var react_icons_1 = require("@radix-ui/react-icons");
var shadcn_1 = require("@/components/atoms/shadcn");
var atoms_1 = require("@/components/atoms");
var schema_1 = require("../wizard/schema");
var useConfiguratorPersistence_1 = require("./hooks/useConfiguratorPersistence");
var steps_1 = require("./steps");
var stepLinks = {
    create: "summary",
    init: "import-data",
    deploy: "hosting",
    seed: "seed-data",
};
function ConfiguratorDashboard() {
    var _this = this;
    var _a = (0, react_1.useState)(schema_1.wizardStateSchema.parse({})), state = _a[0], setState = _a[1];
    var _b = (0, react_1.useState)(null), launchStatus = _b[0], setLaunchStatus = _b[1];
    var _c = (0, react_1.useState)(null), launchError = _c[0], setLaunchError = _c[1];
    var _d = (0, react_1.useState)(null), failedStep = _d[0], setFailedStep = _d[1];
    var _e = (0, react_1.useState)({
        open: false,
        message: "",
    }), toast = _e[0], setToast = _e[1];
    var fetchState = (0, react_1.useCallback)(function () {
        fetch("/cms/api/wizard-progress")
            .then(function (res) { return (res.ok ? res.json() : null); })
            .then(function (json) {
            if (!json)
                return;
            setState(function (prev) { var _a, _b; return (__assign(__assign(__assign({}, prev), ((_a = json.state) !== null && _a !== void 0 ? _a : json)), { completed: (_b = json.completed) !== null && _b !== void 0 ? _b : {} })); });
        })
            .catch(function () { return setState(schema_1.wizardStateSchema.parse({})); });
    }, []);
    (0, react_1.useEffect)(function () {
        fetchState();
    }, [fetchState]);
    (0, react_1.useEffect)(function () {
        var handler = function () { return fetchState(); };
        window.addEventListener("configurator:update", handler);
        return function () { return window.removeEventListener("configurator:update", handler); };
    }, [fetchState]);
    var markStepComplete = (0, useConfiguratorPersistence_1.useConfiguratorPersistence)(state, setState)[0];
    var stepList = (0, react_1.useMemo)(function () { return (0, steps_1.getSteps)(); }, []);
    var missingRequired = (0, steps_1.getRequiredSteps)().filter(function (s) { var _a; return ((_a = state === null || state === void 0 ? void 0 : state.completed) === null || _a === void 0 ? void 0 : _a[s.id]) !== "complete"; });
    var allRequiredDone = missingRequired.length === 0;
    var tooltipText = allRequiredDone
        ? "All steps complete"
        : "Complete required steps: ".concat(missingRequired
            .map(function (s) { return s.label; })
            .join(", "));
    var skipStep = function (stepId) { return markStepComplete(stepId, "skipped"); };
    var resetStep = function (stepId) { return markStepComplete(stepId, "pending"); };
    var handleStepClick = function (step) { return function () {
        var _a;
        var missing = ((_a = step.recommended) !== null && _a !== void 0 ? _a : []).filter(function (id) { var _a; return !((_a = state === null || state === void 0 ? void 0 : state.completed) === null || _a === void 0 ? void 0 : _a[id]); });
        if (missing.length > 0) {
            setToast({
                open: true,
                message: "Recommended to complete: ".concat(missing
                    .map(function (id) { var _a, _b; return (_b = (_a = steps_1.steps[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id; })
                    .join(", ")),
            });
        }
    }; };
    var launchShop = function () { return __awaiter(_this, void 0, void 0, function () {
        var seed, res, reader, decoder, buffer, _a, value, done, parts, _loop_1, _i, parts_1, part;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(state === null || state === void 0 ? void 0 : state.shopId))
                        return [2 /*return*/];
                    if (!allRequiredDone) {
                        setToast({
                            open: true,
                            message: "Complete required steps: ".concat(missingRequired
                                .map(function (s) { return s.label; })
                                .join(", ")),
                        });
                        return [2 /*return*/];
                    }
                    setLaunchError(null);
                    setFailedStep(null);
                    seed = Boolean(state.categoriesText);
                    setLaunchStatus(__assign({ create: "pending", init: "pending", deploy: "pending" }, (seed ? { seed: "pending" } : {})));
                    return [4 /*yield*/, fetch("/cms/api/launch-shop", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ shopId: state.shopId, state: state, seed: seed }),
                        })];
                case 1:
                    res = _c.sent();
                    if (!res.body) {
                        setLaunchError("Launch failed");
                        return [2 /*return*/];
                    }
                    reader = res.body.getReader();
                    decoder = new TextDecoder();
                    buffer = "";
                    _c.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 4];
                    return [4 /*yield*/, reader.read()];
                case 3:
                    _a = _c.sent(), value = _a.value, done = _a.done;
                    if (done)
                        return [3 /*break*/, 4];
                    buffer += decoder.decode(value, { stream: true });
                    parts = buffer.split("\n\n");
                    buffer = (_b = parts.pop()) !== null && _b !== void 0 ? _b : "";
                    _loop_1 = function (part) {
                        var line = part.trim();
                        if (!line.startsWith("data:"))
                            return "continue";
                        var data = JSON.parse(line.slice(5));
                        if (data.step && data.status) {
                            setLaunchStatus(function (prev) {
                                var _a;
                                return (__assign(__assign({}, (prev || {})), (_a = {}, _a[data.step] = data.status, _a)));
                            });
                            if (data.status === "failure") {
                                setLaunchError(data.error || "Launch failed");
                                setFailedStep(data.step);
                            }
                        }
                    };
                    for (_i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                        part = parts_1[_i];
                        _loop_1(part);
                    }
                    return [3 /*break*/, 2];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div>
      <h2 className="mb-4 text-xl font-semibold">Configuration Steps</h2>
      <h3 className="mb-2 font-medium">Required</h3>
      <ul className="mb-6 space-y-2">
        {stepList
            .filter(function (s) { return !s.optional; })
            .map(function (step) {
            var _a;
            var status = (_a = state === null || state === void 0 ? void 0 : state.completed) === null || _a === void 0 ? void 0 : _a[step.id];
            var completed = status === "complete";
            return (<li key={step.id} className="flex items-center gap-2">
                {completed ? (<react_icons_1.CheckCircledIcon className="h-4 w-4 text-green-600"/>) : (<react_icons_1.CircleIcon className="h-4 w-4 text-gray-400"/>)}
                <div className="flex items-center gap-1">
                  <link_1.default href={"/cms/configurator/".concat(step.id)} className="underline" onClick={handleStepClick(step)}>
                    {step.label}
                  </link_1.default>
                </div>
                <span className="text-xs text-gray-500">
                  {completed ? "Done" : "Pending"}
                </span>
                {completed && (<button type="button" onClick={function () { return resetStep(step.id); }} className="text-xs underline">
                    Reset
                  </button>)}
              </li>);
        })}
      </ul>
      {stepList.some(function (s) { return s.optional; }) && (<>
          <h3 className="mb-2 font-medium">Optional</h3>
          <ul className="mb-6 space-y-2">
            {stepList
                .filter(function (s) { return s.optional; })
                .map(function (step) {
                var _a;
                var status = (_a = state === null || state === void 0 ? void 0 : state.completed) === null || _a === void 0 ? void 0 : _a[step.id];
                var completed = status === "complete";
                var skipped = status === "skipped";
                return (<li key={step.id} className="flex items-center gap-2">
                    {completed ? (<react_icons_1.CheckCircledIcon className="h-4 w-4 text-green-600"/>) : (<react_icons_1.CircleIcon className="h-4 w-4 text-gray-400"/>)}
                    <div className="flex items-center gap-1">
                      <link_1.default href={"/cms/configurator/".concat(step.id)} className="underline" onClick={handleStepClick(step)}>
                        {step.label}
                      </link_1.default>
                      <span className="text-xs italic text-gray-500">
                        (Optional)
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {completed ? "Done" : skipped ? "Skipped" : "Pending"}
                    </span>
                    {completed || skipped ? (<button type="button" onClick={function () { return resetStep(step.id); }} className="text-xs underline">
                        Reset
                      </button>) : (<button type="button" onClick={function () { return skipStep(step.id); }} className="text-xs underline">
                        Skip
                      </button>)}
                  </li>);
            })}
          </ul>
        </>)}
      <atoms_1.Tooltip text={tooltipText}>
        <shadcn_1.Button onClick={launchShop} disabled={!allRequiredDone}>
          Launch Shop
        </shadcn_1.Button>
      </atoms_1.Tooltip>
      {!allRequiredDone && (<p className="mt-1 text-xs text-gray-600">
          Complete all required steps before launching.
        </p>)}
      {launchStatus && (<ul className="mt-4 space-y-1 text-sm">
          {Object.entries(launchStatus).map(function (_a) {
                var step = _a[0], status = _a[1];
                return (<li key={step}>
              {step}: {status}
            </li>);
            })}
        </ul>)}
      {launchError && (<p className="mt-2 text-sm text-red-600">
          {launchError}
          {failedStep && stepLinks[failedStep] && (<>
              {" "}
              <link_1.default href={"/cms/configurator/".concat(stepLinks[failedStep])} className="underline">
                Review {steps_1.steps[stepLinks[failedStep]].label}
              </link_1.default>{" "}
              and retry.
            </>)}
        </p>)}
      {toast.open && (<atoms_1.Toast open={toast.open} message={toast.message} onClose={function () { return setToast({ open: false, message: "" }); }}/>)}
    </div>);
}
