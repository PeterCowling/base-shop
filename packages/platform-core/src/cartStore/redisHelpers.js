"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFallback = withFallback;
exports.expireBoth = expireBoth;
exports.skuKey = skuKey;
exports.serialize = serialize;
exports.deserialize = deserialize;
async function withFallback(ops, fallback) {
    let ok = true;
    for (const op of ops) {
        if ((await op()) === undefined)
            ok = false;
    }
    if (!ok) {
        return fallback();
    }
    return undefined;
}
function expireBoth(exec, client, id, ttl, skuKey) {
    return [
        () => exec(() => client.expire(id, ttl)),
        () => exec(() => client.expire(skuKey, ttl)),
    ];
}
function skuKey(id) {
    return `${id}:sku`;
}
function serialize(value) {
    if (value === undefined || value === null)
        return undefined;
    return JSON.stringify(value);
}
function deserialize(value) {
    if (value === undefined || value === null)
        return undefined;
    return JSON.parse(value);
}
