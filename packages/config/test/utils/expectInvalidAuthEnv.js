"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectInvalidAuthEnvWithConfigEnv = void 0;
exports.expectInvalidAuthEnv = expectInvalidAuthEnv;
exports.createExpectInvalidAuthEnv = createExpectInvalidAuthEnv;
const globals_1 = require("@jest/globals");
const withEnv_1 = require("./withEnv");
async function runAccessor(accessor) {
    globals_1.jest.resetModules();
    if (typeof globals_1.jest.isolateModulesAsync === "function") {
        await globals_1.jest.isolateModulesAsync(async () => {
            const authModule = await Promise.resolve().then(() => __importStar(require("@acme/config/env/auth")));
            await accessor(authModule);
        });
        return;
    }
    await new Promise((resolve, reject) => {
        globals_1.jest.isolateModules(() => {
            Promise.resolve()
                .then(() => Promise.resolve().then(() => __importStar(require("@acme/config/env/auth"))))
                .then((authModule) => accessor(authModule))
                .then(() => resolve())
                .catch(reject);
        });
    });
}
async function expectInvalidAuthEnv(options) {
    const { env, accessor, withEnv, consoleErrorSpy, expectedMessage = "Invalid auth environment variables", } = options;
    const spy = consoleErrorSpy ?? globals_1.jest.spyOn(console, "error").mockImplementation(() => { });
    try {
        await withEnv(env, async () => {
            const prevSkip = globalThis.__ACME_SKIP_EAGER_AUTH_ENV__;
            globalThis.__ACME_SKIP_EAGER_AUTH_ENV__ = true;
            const invokeAccessor = async () => {
                try {
                    await runAccessor(accessor);
                }
                finally {
                    if (typeof prevSkip === "undefined") {
                        delete globalThis.__ACME_SKIP_EAGER_AUTH_ENV__;
                    }
                    else {
                        globalThis.__ACME_SKIP_EAGER_AUTH_ENV__ =
                            prevSkip;
                    }
                }
            };
            await (0, globals_1.expect)(invokeAccessor()).rejects.toThrow(expectedMessage);
        });
    }
    finally {
        if (!consoleErrorSpy) {
            spy.mockRestore();
        }
    }
}
function createExpectInvalidAuthEnv(withEnvImpl) {
    return (options) => expectInvalidAuthEnv({ ...options, withEnv: withEnvImpl });
}
exports.expectInvalidAuthEnvWithConfigEnv = createExpectInvalidAuthEnv(withEnv_1.withEnv);
