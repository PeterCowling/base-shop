"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShopDelegate = createShopDelegate;
function createShopDelegate() {
    const delegate = {
        async findUnique() {
            return { data: {} };
        },
    };
    return delegate;
}
