"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sectionTemplateDelegate = void 0;
exports.createSectionTemplateDelegate = createSectionTemplateDelegate;
function createSectionTemplateDelegate() {
    const rows = [];
    const match = (obj, where = {}) => Object.entries(where).every(([k, v]) => obj[k] === v);
    return {
        async findMany({ where } = {}) {
            return rows.filter((r) => match(r, where));
        },
        async upsert({ where, update, create }) {
            const idx = rows.findIndex((r) => match(r, where));
            if (idx >= 0) {
                rows[idx] = { ...rows[idx], ...update };
                return rows[idx];
            }
            const rec = { ...create };
            rows.push(rec);
            return rec;
        },
        async deleteMany({ where }) {
            let count = 0;
            for (let i = rows.length - 1; i >= 0; i--) {
                if (match(rows[i], where)) {
                    rows.splice(i, 1);
                    count++;
                }
            }
            return { count };
        },
        async update({ where, data }) {
            const idx = rows.findIndex((r) => match(r, where));
            if (idx < 0)
                throw new Error("SectionTemplate not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
            rows[idx] = { ...rows[idx], ...data };
            return rows[idx];
        },
    };
}
exports.sectionTemplateDelegate = createSectionTemplateDelegate();
