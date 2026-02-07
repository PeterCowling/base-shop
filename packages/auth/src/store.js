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
exports.SESSION_TTL_S = exports.SESSION_TTL_MS = void 0;
exports.setSessionStoreFactory = setSessionStoreFactory;
exports.createSessionStore = createSessionStore;
const core_1 = require("@acme/config/env/core");
exports.SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // one week
exports.SESSION_TTL_S = Math.floor(exports.SESSION_TTL_MS / 1000);
let customFactory = null;
function setSessionStoreFactory(factory) {
    customFactory = factory;
}
async function createSessionStore() {
    if (customFactory) {
        return customFactory();
    }
    const storeType = core_1.coreEnv.SESSION_STORE_PROVIDER ?? core_1.coreEnv.SESSION_STORE;
    if (storeType === "redis" ||
        (!storeType &&
            core_1.coreEnv.UPSTASH_REDIS_REST_URL &&
            core_1.coreEnv.UPSTASH_REDIS_REST_TOKEN)) {
        try {
            const { Redis } = await Promise.resolve().then(() => __importStar(require("@upstash/redis"))); // i18n-exempt: module specifier; not user-facing copy
            const { RedisSessionStore } = await Promise.resolve().then(() => __importStar(require("./redisStore")));
            const client = new Redis({
                url: core_1.coreEnv.UPSTASH_REDIS_REST_URL,
                token: core_1.coreEnv.UPSTASH_REDIS_REST_TOKEN,
            });
            return new RedisSessionStore(client, exports.SESSION_TTL_S);
        }
        catch (error) {
            console.error("Failed to initialize Redis session store", // i18n-exempt: internal diagnostic log; not user-facing
            error);
        }
    }
    if (storeType === "cloudflare") {
        try {
            const binding = globalThis.SESSION_DO;
            if (binding) {
                const { CloudflareDurableObjectSessionStore } = await Promise.resolve().then(() => __importStar(require("./sessionDurableStore")));
                return new CloudflareDurableObjectSessionStore(binding, exports.SESSION_TTL_S);
            }
            console.warn("SESSION_STORE_PROVIDER=cloudflare but no SESSION_DO binding found; falling back to MemorySessionStore");
        }
        catch (error) {
            console.error("Failed to initialize Cloudflare session store", // i18n-exempt: internal diagnostic log; not user-facing
            error);
        }
    }
    const { MemorySessionStore } = await Promise.resolve().then(() => __importStar(require("./memoryStore")));
    return new MemorySessionStore(exports.SESSION_TTL_S);
}
