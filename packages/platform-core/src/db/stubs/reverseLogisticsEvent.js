"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReverseLogisticsEventDelegate = createReverseLogisticsEventDelegate;
function createReverseLogisticsEventDelegate() {
    const events = [];
    return {
        async create({ data }) {
            events.push({ ...data });
            return data;
        },
        async createMany({ data }) {
            events.push(...data.map((e) => ({ ...e })));
            return { count: data.length };
        },
        async findMany({ where } = {}) {
            return events.filter((e) => Object.entries(where ?? {}).every(([k, v]) => e[k] === v));
        },
    };
}
