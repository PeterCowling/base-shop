"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDemoAvailabilityAdapter = createDemoAvailabilityAdapter;
function createDemoAvailabilityAdapter() {
    return {
        async getAvailability(sku, range, _locationId) {
            const start = new Date(range.start);
            const end = new Date(range.end);
            const blocks = [];
            // Block weekends in the selected range as a simple demo
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const day = d.getDay();
                if (day === 0 || day === 6)
                    blocks.push(new Date(d).toISOString().slice(0, 10));
            }
            const available = blocks.length === 0;
            return { available, blocks, capacity: available ? 5 : 0 };
        },
    };
}
