// apps/cms/src/app/cms/blog/sanity/connect/ConnectForm.client.tsx
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
exports.default = ConnectForm;
var react_dom_1 = require("react-dom");
var react_1 = require("react");
var shadcn_1 = require("@/components/atoms/shadcn");
var _ui_1 = require("@ui");
var saveSanityConfig_1 = require("@cms/actions/saveSanityConfig");
var deleteSanityConfig_1 = require("@cms/actions/deleteSanityConfig");
var initialState = { message: "", error: "", errorCode: "" };
var errorMessages = {
    INVALID_CREDENTIALS: "Invalid Sanity credentials",
    DATASET_CREATE_ERROR: "Failed to create dataset",
    DATASET_LIST_ERROR: "Failed to list datasets",
    SCHEMA_UPLOAD_ERROR: "Failed to upload schema",
    UNKNOWN_ERROR: "An unknown error occurred",
};
var defaultDataset = "blog";
function ConnectForm(_a) {
    var _b, _c, _d, _e;
    var shopId = _a.shopId, initial = _a.initial;
    var saveAction = saveSanityConfig_1.saveSanityConfig.bind(null, shopId);
    var _f = (0, react_dom_1.useFormState)(saveAction, initialState), state = _f[0], formAction = _f[1];
    var disconnectAction = deleteSanityConfig_1.deleteSanityConfig.bind(null, shopId);
    var _g = (0, react_dom_1.useFormState)(disconnectAction, initialState), disconnectState = _g[0], disconnectFormAction = _g[1];
    var _h = (0, react_1.useState)((_b = initial === null || initial === void 0 ? void 0 : initial.projectId) !== null && _b !== void 0 ? _b : ""), projectId = _h[0], setProjectId = _h[1];
    var _j = (0, react_1.useState)((_c = initial === null || initial === void 0 ? void 0 : initial.dataset) !== null && _c !== void 0 ? _c : defaultDataset), dataset = _j[0], setDataset = _j[1];
    var _k = (0, react_1.useState)((_d = initial === null || initial === void 0 ? void 0 : initial.token) !== null && _d !== void 0 ? _d : ""), token = _k[0], setToken = _k[1];
    var _l = (0, react_1.useState)((initial === null || initial === void 0 ? void 0 : initial.dataset) ? [initial.dataset] : [defaultDataset]), datasets = _l[0], setDatasets = _l[1];
    var _m = (0, react_1.useState)(false), isAddingDataset = _m[0], setIsAddingDataset = _m[1];
    var _o = (0, react_1.useState)("public"), aclMode = _o[0], setAclMode = _o[1];
    var _p = (0, react_1.useState)("idle"), verifyStatus = _p[0], setVerifyStatus = _p[1];
    var _q = (0, react_1.useState)(""), verifyError = _q[0], setVerifyError = _q[1];
    var _r = (0, react_1.useState)(1), step = _r[0], setStep = _r[1];
    var creatingDatasetRef = (0, react_1.useRef)(false);
    function verify() {
        return __awaiter(this, void 0, void 0, function () {
            var res, json, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!projectId || !token || !dataset) {
                            return [2 /*return*/];
                        }
                        setVerifyStatus("loading");
                        setVerifyError("");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("/api/sanity/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ projectId: projectId, dataset: dataset, token: token }),
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = (_b.sent());
                        if (json.ok) {
                            setDatasets(json.datasets && json.datasets.length
                                ? json.datasets
                                : [dataset || defaultDataset]);
                            setVerifyStatus("success");
                        }
                        else {
                            setDatasets(json.datasets && json.datasets.length
                                ? json.datasets
                                : [dataset || defaultDataset]);
                            setVerifyError((json.errorCode && errorMessages[json.errorCode]) ||
                                json.error ||
                                "Invalid Sanity credentials");
                            setVerifyStatus("error");
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        setDatasets([dataset || defaultDataset]);
                        setVerifyError("Invalid Sanity credentials");
                        setVerifyStatus("error");
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    (0, react_1.useEffect)(function () {
        if (projectId && token) {
            void verify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    (0, react_1.useEffect)(function () {
        if (projectId && token && dataset) {
            void verify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataset]);
    (0, react_1.useEffect)(function () {
        if (state.message) {
            if (creatingDatasetRef.current) {
                void verify();
                creatingDatasetRef.current = false;
            }
            setStep(3);
        }
    }, [state.message]);
    var message = state.message || disconnectState.message;
    var errorCode = state.errorCode || disconnectState.errorCode;
    var rawError = state.error || disconnectState.error;
    var error = errorCode ? (_e = errorMessages[errorCode]) !== null && _e !== void 0 ? _e : rawError : rawError;
    return (<div className="space-y-4 max-w-md">
      {step === 1 && (<div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="projectId">
              Project ID
            </label>
            <input id="projectId" name="projectId" className="w-full rounded border p-2" value={projectId} onChange={function (e) { return setProjectId(e.target.value); }} required/>
            <p className="text-xs text-muted-foreground">
              Find this in your Sanity project settings.
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="token">
              Token
            </label>
            <input id="token" name="token" type="password" className="w-full rounded border p-2" value={token} onChange={function (e) { return setToken(e.target.value); }} required/>
            <p className="text-xs text-muted-foreground">
              Token with write scope for the default dataset.
            </p>
          </div>
          <div className="space-y-2">
            <shadcn_1.Button type="button" className="bg-primary text-white" onClick={function () { return void verify(); }}>
              Verify
            </shadcn_1.Button>
            {verifyStatus === "loading" && (<p className="text-xs text-muted-foreground">
                Verifying credentials...
              </p>)}
            {verifyStatus === "success" && (<>
                <p className="text-xs text-green-600">Credentials verified</p>
                <shadcn_1.Button type="button" onClick={function () { return setStep(2); }}>
                  Next
                </shadcn_1.Button>
              </>)}
            {verifyStatus === "error" && (<p className="text-xs text-red-600">{verifyError}</p>)}
          </div>
        </div>)}

      {step === 2 && (<form action={formAction} className="space-y-4" onSubmit={function () {
                creatingDatasetRef.current =
                    isAddingDataset && dataset !== defaultDataset;
            }}>
          <input type="hidden" name="projectId" value={projectId}/>
          <input type="hidden" name="token" value={token}/>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="dataset">
              Dataset
            </label>
            {isAddingDataset ? (<input id="dataset" name="dataset" className="w-full rounded border p-2" value={dataset} onChange={function (e) { return setDataset(e.target.value); }} required/>) : (<select id="dataset" name="dataset" className="w-full rounded border p-2" value={dataset} onChange={function (e) {
                    if (e.target.value === "__add__") {
                        setIsAddingDataset(true);
                    }
                    else {
                        setIsAddingDataset(false);
                        setDataset(e.target.value);
                    }
                }} required>
                <option value="" disabled>
                  Select dataset
                </option>
                {datasets.map(function (d) { return (<option key={d} value={d}>
                    {d}
                  </option>); })}
                <option value="__add__">Add dataset</option>
              </select>)}
            {isAddingDataset && dataset !== defaultDataset && (<input type="hidden" name="createDataset" value="true"/>)}
            <p className="text-xs text-muted-foreground">
              Dataset with read and write permissions.
            </p>
            <DatasetCreationStatus isAddingDataset={isAddingDataset}/>
            {verifyStatus === "loading" && (<p className="text-xs text-muted-foreground">Verifying dataset...</p>)}
            {verifyStatus === "success" && (<p className="text-xs text-green-600">Dataset verified</p>)}
            {verifyStatus === "error" && (<p className="text-xs text-red-600">{verifyError}</p>)}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="aclMode">
              Access level
            </label>
            <select id="aclMode" name="aclMode" className="w-full rounded border p-2" value={aclMode} onChange={function (e) {
                return setAclMode(e.target.value);
            }}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Public datasets are readable by anyone; private require auth.
            </p>
          </div>
          <SubmitButton isCreating={isAddingDataset}/>
        </form>)}

      {step === 3 && (<div className="space-y-2">
          <p className="text-green-600">{state.message}</p>
        </div>)}

      {initial && (<form action={disconnectFormAction}>
          <shadcn_1.Button type="submit" variant="destructive">
            Disconnect
          </shadcn_1.Button>
        </form>)}
      <_ui_1.Toast open={Boolean(message || error)} message={message || error || ""}/>
    </div>);
}
function SubmitButton(_a) {
    var isCreating = _a.isCreating;
    var pending = (0, react_dom_1.useFormStatus)().pending;
    var label = pending ? (isCreating ? "Creating dataset..." : "Saving...") : "Save";
    return (<shadcn_1.Button type="submit" className="bg-primary text-white" disabled={pending}>
      {label}
    </shadcn_1.Button>);
}
function DatasetCreationStatus(_a) {
    var isAddingDataset = _a.isAddingDataset;
    var pending = (0, react_dom_1.useFormStatus)().pending;
    if (!pending || !isAddingDataset)
        return null;
    return (<p className="text-xs text-muted-foreground">Creating dataset...</p>);
}
