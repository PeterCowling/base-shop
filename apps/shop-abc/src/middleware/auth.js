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
exports.MAX_REGISTRATION_ATTEMPTS = exports.MAX_ATTEMPTS = void 0;
exports.checkLoginRateLimit = checkLoginRateLimit;
exports.clearLoginAttempts = clearLoginAttempts;
exports.__resetLoginRateLimiter = __resetLoginRateLimiter;
exports.checkMfaRateLimit = checkMfaRateLimit;
exports.clearMfaAttempts = clearMfaAttempts;
exports.__resetMfaRateLimiter = __resetMfaRateLimiter;
exports.checkRegistrationRateLimit = checkRegistrationRateLimit;
exports.__resetRegistrationRateLimiter = __resetRegistrationRateLimiter;
var server_1 = require("next/server");
var cache_1 = require("./cache");
var logger_1 = require("./logger");
exports.MAX_ATTEMPTS = 3;
exports.MAX_REGISTRATION_ATTEMPTS = 3;
var LOCK_MS = 5 * 60 * 1000; // 5 minutes
var COUNT_PREFIX = "login:count:";
var LOCK_PREFIX = "login:lock:";
var REG_COUNT_PREFIX = "register:count:";
var REG_LOCK_PREFIX = "register:lock:";
var MFA_COUNT_PREFIX = "mfa:count:";
var MFA_LOCK_PREFIX = "mfa:lock:";
function key(ip, user) {
    return "".concat(ip, ":").concat(user);
}
function checkLoginRateLimit(ip, user) {
    return __awaiter(this, void 0, void 0, function () {
        var k, now, lockKey, countKey, locked, count, record;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    k = key(ip, user);
                    now = Date.now();
                    if (!cache_1.redis) return [3 /*break*/, 7];
                    lockKey = "".concat(LOCK_PREFIX).concat(k);
                    countKey = "".concat(COUNT_PREFIX).concat(k);
                    return [4 /*yield*/, cache_1.redis.exists(lockKey)];
                case 1:
                    locked = _b.sent();
                    if (locked) {
                        (0, logger_1.warn)("login", "locked out ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 })];
                    }
                    return [4 /*yield*/, cache_1.redis.incr(countKey)];
                case 2:
                    count = _b.sent();
                    if (!(count === 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, cache_1.redis.pexpire(countKey, LOCK_MS)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!(count > exports.MAX_ATTEMPTS)) return [3 /*break*/, 6];
                    return [4 /*yield*/, cache_1.redis.set(lockKey, "1", { px: LOCK_MS })];
                case 5:
                    _b.sent();
                    (0, logger_1.warn)("login", "lockout ".concat(k));
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 })];
                case 6: return [2 /*return*/, null];
                case 7:
                    record = (_a = cache_1.attempts.get(k)) !== null && _a !== void 0 ? _a : { count: 0, lockedUntil: 0 };
                    if (record.lockedUntil > now) {
                        (0, logger_1.warn)("login", "locked out ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 })];
                    }
                    if (record.lockedUntil && record.lockedUntil <= now) {
                        record.count = 0;
                        record.lockedUntil = 0;
                    }
                    record.count += 1;
                    if (record.count > exports.MAX_ATTEMPTS) {
                        record.lockedUntil = now + LOCK_MS;
                        cache_1.attempts.set(k, record);
                        (0, logger_1.warn)("login", "lockout ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 })];
                    }
                    cache_1.attempts.set(k, record);
                    return [2 /*return*/, null];
            }
        });
    });
}
function clearLoginAttempts(ip, user) {
    return __awaiter(this, void 0, void 0, function () {
        var k;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    k = key(ip, user);
                    if (!cache_1.redis) return [3 /*break*/, 2];
                    return [4 /*yield*/, cache_1.redis.del("".concat(COUNT_PREFIX).concat(k), "".concat(LOCK_PREFIX).concat(k))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    cache_1.attempts.delete(k);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function __resetLoginRateLimiter() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!cache_1.redis) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, cache_1.redis.flushall()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 6];
                case 5:
                    cache_1.attempts.clear();
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function checkMfaRateLimit(ip, user) {
    return __awaiter(this, void 0, void 0, function () {
        var k, now, lockKey, countKey, locked, count, record;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    k = key(ip, user);
                    now = Date.now();
                    if (!cache_1.redis) return [3 /*break*/, 7];
                    lockKey = "".concat(MFA_LOCK_PREFIX).concat(k);
                    countKey = "".concat(MFA_COUNT_PREFIX).concat(k);
                    return [4 /*yield*/, cache_1.redis.exists(lockKey)];
                case 1:
                    locked = _b.sent();
                    if (locked) {
                        (0, logger_1.warn)("mfa", "locked out ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many MFA attempts. Try again later." }, { status: 429 })];
                    }
                    return [4 /*yield*/, cache_1.redis.incr(countKey)];
                case 2:
                    count = _b.sent();
                    if (!(count === 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, cache_1.redis.pexpire(countKey, LOCK_MS)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!(count > exports.MAX_ATTEMPTS)) return [3 /*break*/, 6];
                    return [4 /*yield*/, cache_1.redis.set(lockKey, "1", { px: LOCK_MS })];
                case 5:
                    _b.sent();
                    (0, logger_1.warn)("mfa", "lockout ".concat(k));
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Too many MFA attempts. Try again later." }, { status: 429 })];
                case 6: return [2 /*return*/, null];
                case 7:
                    record = (_a = cache_1.mfaAttempts.get(k)) !== null && _a !== void 0 ? _a : { count: 0, lockedUntil: 0 };
                    if (record.lockedUntil > now) {
                        (0, logger_1.warn)("mfa", "locked out ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many MFA attempts. Try again later." }, { status: 429 })];
                    }
                    if (record.lockedUntil && record.lockedUntil <= now) {
                        record.count = 0;
                        record.lockedUntil = 0;
                    }
                    record.count += 1;
                    if (record.count > exports.MAX_ATTEMPTS) {
                        record.lockedUntil = now + LOCK_MS;
                        cache_1.mfaAttempts.set(k, record);
                        (0, logger_1.warn)("mfa", "lockout ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many MFA attempts. Try again later." }, { status: 429 })];
                    }
                    cache_1.mfaAttempts.set(k, record);
                    return [2 /*return*/, null];
            }
        });
    });
}
function clearMfaAttempts(ip, user) {
    return __awaiter(this, void 0, void 0, function () {
        var k;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    k = key(ip, user);
                    if (!cache_1.redis) return [3 /*break*/, 2];
                    return [4 /*yield*/, cache_1.redis.del("".concat(MFA_COUNT_PREFIX).concat(k), "".concat(MFA_LOCK_PREFIX).concat(k))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    cache_1.mfaAttempts.delete(k);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function __resetMfaRateLimiter() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!cache_1.redis) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, cache_1.redis.flushall()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 6];
                case 5:
                    cache_1.mfaAttempts.clear();
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function checkRegistrationRateLimit(ip) {
    return __awaiter(this, void 0, void 0, function () {
        var k, now, lockKey, countKey, locked, count, record;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    k = ip;
                    now = Date.now();
                    if (!cache_1.redis) return [3 /*break*/, 7];
                    lockKey = "".concat(REG_LOCK_PREFIX).concat(k);
                    countKey = "".concat(REG_COUNT_PREFIX).concat(k);
                    return [4 /*yield*/, cache_1.redis.exists(lockKey)];
                case 1:
                    locked = _b.sent();
                    if (locked) {
                        (0, logger_1.warn)("register", "locked out ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 })];
                    }
                    return [4 /*yield*/, cache_1.redis.incr(countKey)];
                case 2:
                    count = _b.sent();
                    if (!(count === 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, cache_1.redis.pexpire(countKey, LOCK_MS)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!(count > exports.MAX_REGISTRATION_ATTEMPTS)) return [3 /*break*/, 6];
                    return [4 /*yield*/, cache_1.redis.set(lockKey, "1", { px: LOCK_MS })];
                case 5:
                    _b.sent();
                    (0, logger_1.warn)("register", "lockout ".concat(k));
                    return [2 /*return*/, server_1.NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 })];
                case 6: return [2 /*return*/, null];
                case 7:
                    record = (_a = cache_1.registrationAttempts.get(k)) !== null && _a !== void 0 ? _a : { count: 0, lockedUntil: 0 };
                    if (record.lockedUntil > now) {
                        (0, logger_1.warn)("register", "locked out ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 })];
                    }
                    if (record.lockedUntil && record.lockedUntil <= now) {
                        record.count = 0;
                        record.lockedUntil = 0;
                    }
                    record.count += 1;
                    if (record.count > exports.MAX_REGISTRATION_ATTEMPTS) {
                        record.lockedUntil = now + LOCK_MS;
                        cache_1.registrationAttempts.set(k, record);
                        (0, logger_1.warn)("register", "lockout ".concat(k));
                        return [2 /*return*/, server_1.NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 })];
                    }
                    cache_1.registrationAttempts.set(k, record);
                    return [2 /*return*/, null];
            }
        });
    });
}
function __resetRegistrationRateLimiter() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!cache_1.redis) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, cache_1.redis.flushall()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 6];
                case 5:
                    cache_1.registrationAttempts.clear();
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
