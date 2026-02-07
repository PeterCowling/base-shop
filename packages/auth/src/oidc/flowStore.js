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
exports.OIDC_FLOW_TTL_S = void 0;
exports.createOidcAuthFlowStore = createOidcAuthFlowStore;
require("server-only");
const core_1 = require("@acme/config/env/core");
exports.OIDC_FLOW_TTL_S = 60 * 10;
class MemoryOidcAuthFlowStore {
    ttlSeconds;
    flows = new Map();
    constructor(ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }
    async get(state) {
        const entry = this.flows.get(state);
        if (!entry)
            return null;
        if (entry.expires <= Date.now()) {
            this.flows.delete(state);
            return null;
        }
        return entry.record;
    }
    async set(record) {
        this.flows.set(record.state, {
            record,
            expires: Date.now() + this.ttlSeconds * 1000,
        });
    }
    async delete(state) {
        this.flows.delete(state);
    }
}
class RedisOidcAuthFlowStore {
    client;
    ttlSeconds;
    constructor(client, ttlSeconds) {
        this.client = client;
        this.ttlSeconds = ttlSeconds;
    }
    key(state) {
        return `oidc_flow:${state}`;
    }
    async get(state) {
        const data = await this.client.get(this.key(state));
        if (!data)
            return null;
        return { ...data, createdAt: new Date(data.createdAt) };
    }
    async set(record) {
        await this.client.set(this.key(record.state), record, { ex: this.ttlSeconds });
    }
    async delete(state) {
        await this.client.del(this.key(state));
    }
}
async function createOidcAuthFlowStore() {
    const storeType = core_1.coreEnv.SESSION_STORE_PROVIDER ?? core_1.coreEnv.SESSION_STORE;
    if (storeType === "redis" ||
        (!storeType &&
            core_1.coreEnv.UPSTASH_REDIS_REST_URL &&
            core_1.coreEnv.UPSTASH_REDIS_REST_TOKEN)) {
        try {
            const { Redis } = await Promise.resolve().then(() => __importStar(require("@upstash/redis"))); // i18n-exempt: module specifier; not user-facing copy
            const client = new Redis({
                url: core_1.coreEnv.UPSTASH_REDIS_REST_URL,
                token: core_1.coreEnv.UPSTASH_REDIS_REST_TOKEN,
            });
            return new RedisOidcAuthFlowStore(client, exports.OIDC_FLOW_TTL_S);
        }
        catch (error) {
            console.error("Failed to initialize Redis OIDC flow store", // i18n-exempt: internal diagnostic log; not user-facing
            error);
        }
    }
    return new MemoryOidcAuthFlowStore(exports.OIDC_FLOW_TTL_S);
}
