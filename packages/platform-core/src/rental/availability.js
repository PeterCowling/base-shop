"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureAvailabilityAdapter = configureAvailabilityAdapter;
exports.getAvailability = getAvailability;
let adapter = null;
function configureAvailabilityAdapter(a) {
    adapter = a;
}
async function getAvailability(sku, range, locationId) {
    if (!adapter) {
        return { available: false, blocks: [] };
    }
    try {
        return await adapter.getAvailability(sku, range, locationId);
    }
    catch {
        return { available: false, blocks: [] };
    }
}
