"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = normalize;
require("server-only");
function normalize(order) {
    if (!order)
        return order;
    const o = { ...order };
    Object.keys(o).forEach((k) => {
        if (o[k] === null) {
            o[k] = undefined;
        }
    });
    return o;
}
