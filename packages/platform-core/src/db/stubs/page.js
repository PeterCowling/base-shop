"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageDelegate = void 0;
exports.createPageDelegate = createPageDelegate;
function createPageDelegate() {
    const pages = [];
    const match = (obj, where = {}) => Object.entries(where).every(([k, v]) => obj[k] === v);
    return {
        async createMany({ data }) {
            pages.push(...data.map((d) => ({ ...d })));
            return { count: data.length };
        },
        async findMany({ where } = {}) {
            return pages.filter((p) => match(p, where));
        },
        async update({ where, data }) {
            const idx = pages.findIndex((p) => match(p, where));
            if (idx < 0)
                throw new Error("Page not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
            pages[idx] = { ...pages[idx], ...data };
            return pages[idx];
        },
        async deleteMany({ where }) {
            let count = 0;
            for (let i = pages.length - 1; i >= 0; i--) {
                if (match(pages[i], where)) {
                    pages.splice(i, 1);
                    count++;
                }
            }
            return { count };
        },
        async upsert({ where, update, create }) {
            const idx = pages.findIndex((p) => match(p, where));
            if (idx >= 0) {
                pages[idx] = { ...pages[idx], ...update };
                return pages[idx];
            }
            const record = { ...create };
            pages.push(record);
            return record;
        },
    };
}
// Instantiate a default delegate instance for convenience in tests
exports.pageDelegate = createPageDelegate();
