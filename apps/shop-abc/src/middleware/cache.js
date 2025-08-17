"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.mfaAttempts = exports.registrationAttempts = exports.attempts = void 0;
var redis_1 = require("@upstash/redis");
var config_1 = require("@acme/config");
exports.attempts = new Map();
exports.registrationAttempts = new Map();
exports.mfaAttempts = new Map();
exports.redis = null;
if (config_1.env.LOGIN_RATE_LIMIT_REDIS_URL && config_1.env.LOGIN_RATE_LIMIT_REDIS_TOKEN) {
    exports.redis = new redis_1.Redis({
        url: config_1.env.LOGIN_RATE_LIMIT_REDIS_URL,
        token: config_1.env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
    });
}
else if (config_1.env.UPSTASH_REDIS_REST_URL && config_1.env.UPSTASH_REDIS_REST_TOKEN) {
    exports.redis = new redis_1.Redis({
        url: config_1.env.UPSTASH_REDIS_REST_URL,
        token: config_1.env.UPSTASH_REDIS_REST_TOKEN,
    });
}
