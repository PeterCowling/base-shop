// apps/cms/src/app/(auth)/login/LoginForm.tsx
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
exports.default = LoginForm;
var shadcn_1 = require("@/components/atoms/shadcn");
var react_1 = require("next-auth/react");
var link_1 = require("next/link");
var navigation_1 = require("next/navigation");
var react_2 = require("react");
function LoginForm(_a) {
    var _b;
    var fallbackUrl = _a.fallbackUrl;
    var router = (0, navigation_1.useRouter)();
    var search = (0, navigation_1.useSearchParams)();
    var callbackUrl = (_b = search.get("callbackUrl")) !== null && _b !== void 0 ? _b : fallbackUrl;
    function absolutify(url) {
        try {
            return new URL(url, window.location.origin).toString();
        }
        catch (_a) {
            return url;
        }
    }
    var _c = (0, react_2.useState)(null), error = _c[0], setError = _c[1];
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, email, password, absoluteUrl, res;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        setError(null);
                        formData = new FormData(e.currentTarget);
                        email = formData.get("email");
                        password = formData.get("password");
                        console.log("[LoginForm] submit", { email: email, callbackUrl: callbackUrl });
                        absoluteUrl = absolutify(callbackUrl);
                        return [4 /*yield*/, (0, react_1.signIn)("credentials", {
                                redirect: false,
                                email: email,
                                password: password,
                                callbackUrl: absoluteUrl,
                            })];
                    case 1:
                        res = _b.sent();
                        console.log("[LoginForm] signIn result", res);
                        if (res === null || res === void 0 ? void 0 : res.ok) {
                            console.log("[LoginForm] redirect to", callbackUrl);
                            router.push(callbackUrl);
                        }
                        else {
                            setError((_a = res === null || res === void 0 ? void 0 : res.error) !== null && _a !== void 0 ? _a : "Invalid email or password");
                            if (res === null || res === void 0 ? void 0 : res.error)
                                console.error("Login error:", res.error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    return (<form onSubmit={handleSubmit} className="mx-auto mt-40 w-72 space-y-4">
      <h2 className="text-lg font-semibold">Sign in</h2>

      <shadcn_1.Input name="email" type="email" placeholder="Email" required className="w-full"/>
      <shadcn_1.Input name="password" type="password" placeholder="Password" required className="w-full"/>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <shadcn_1.Button className="w-full" type="submit">
        Continue
      </shadcn_1.Button>
      <p className="text-center text-sm">
        <link_1.default href="/signup" className="underline">
          Create new account
        </link_1.default>
      </p>
    </form>);
}
