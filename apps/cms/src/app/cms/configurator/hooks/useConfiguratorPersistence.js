// apps/cms/src/app/cms/configurator/hooks/useConfiguratorPersistence.ts
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEY = void 0;
exports.resetConfiguratorProgress = resetConfiguratorProgress;
exports.useConfiguratorPersistence = useConfiguratorPersistence;
var react_1 = require("react");
var schema_1 = require("../../wizard/schema");
/** Key used to mirror configurator progress in localStorage for preview components. */
exports.STORAGE_KEY = "cms-configurator-progress";
/** Clears persisted configurator progress on the server and localStorage. */
function resetConfiguratorProgress() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(typeof window !== "undefined")) return [3 /*break*/, 4];
                    localStorage.removeItem(exports.STORAGE_KEY);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/cms/api/wizard-progress", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ stepId: null, data: {}, completed: {} }),
                        })];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Loads configurator state from the server and saves it back whenever the state
 * changes. A copy is mirrored to localStorage so the live preview can read it.
 */
function useConfiguratorPersistence(state, setState, onInvalid, onSave) {
    var _a = (0, react_1.useState)(false), saving = _a[0], setSaving = _a[1];
    /* Load persisted state on mount */
    (0, react_1.useEffect)(function () {
        if (typeof window === "undefined")
            return;
        fetch("/cms/api/wizard-progress")
            .then(function (res) { return (res.ok ? res.json() : null); })
            .then(function (json) {
            var _a, _b;
            if (!json)
                return;
            var parsed = schema_1.wizardStateSchema.safeParse(__assign(__assign({}, ((_a = json.state) !== null && _a !== void 0 ? _a : json)), { completed: (_b = json.completed) !== null && _b !== void 0 ? _b : {} }));
            if (parsed.success) {
                setState(parsed.data);
                try {
                    localStorage.setItem(exports.STORAGE_KEY, JSON.stringify(parsed.data));
                    window.dispatchEvent(new CustomEvent("configurator:update"));
                }
                catch (_c) {
                    /* ignore */
                }
            }
            else {
                resetConfiguratorProgress();
                onInvalid === null || onInvalid === void 0 ? void 0 : onInvalid();
            }
        })
            .catch(function () {
            /* ignore */
        });
    }, [setState]);
    /* Persist whenever the state changes */
    (0, react_1.useEffect)(function () {
        if (typeof window === "undefined")
            return;
        setSaving(true);
        var timer = setTimeout(function () {
            try {
                localStorage.setItem(exports.STORAGE_KEY, JSON.stringify(state));
                window.dispatchEvent(new CustomEvent("configurator:update"));
            }
            catch (_a) {
                /* ignore quota */
            }
            var completed = state.completed, data = __rest(state, ["completed"]);
            fetch("/cms/api/wizard-progress", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepId: "configurator", data: data }),
            })
                .catch(function () {
                /* ignore network errors */
            })
                .finally(function () {
                setSaving(false);
                onSave === null || onSave === void 0 ? void 0 : onSave();
            });
        }, 500);
        return function () { return clearTimeout(timer); };
    }, [state, onSave]);
    /* Expose completion helper */
    var markStepComplete = function (stepId, status) {
        var updated = null;
        setState(function (prev) {
            var _a;
            updated = __assign(__assign({}, prev), { completed: __assign(__assign({}, prev.completed), (_a = {}, _a[stepId] = status, _a)) });
            return updated;
        });
        if (typeof window !== "undefined" && updated) {
            try {
                localStorage.setItem(exports.STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("configurator:update"));
            }
            catch (_a) {
                /* ignore quota */
            }
            fetch("/cms/api/wizard-progress", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepId: stepId, completed: status }),
            }).catch(function () {
                /* ignore network errors */
            });
        }
    };
    return [markStepComplete, saving];
}
