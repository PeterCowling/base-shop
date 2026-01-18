"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserDelegate = createUserDelegate;
function createUserDelegate() {
    const users = [
        {
            id: "user1",
            email: "u1@test.com",
        },
        {
            id: "user2",
            email: "u2@test.com",
        },
    ];
    const getValue = (user, key) => user[key];
    const matches = (user, criteria) => Object.entries(criteria).every(([key, value]) => value === undefined ? true : getValue(user, key) === value);
    const matchesNot = (user, criteria) => Object.entries(criteria).some(([key, value]) => value === undefined ? false : getValue(user, key) === value);
    const findIdx = (where) => users.findIndex((user) => {
        const { NOT, ...rest } = where ?? {};
        if (NOT && matchesNot(user, NOT))
            return false;
        return matches(user, rest);
    });
    return {
        async findUnique({ where }) {
            const idx = findIdx(where);
            return idx >= 0 ? users[idx] : null;
        },
        async findFirst({ where }) {
            const idx = findIdx(where);
            return idx >= 0 ? users[idx] : null;
        },
        async create({ data }) {
            users.push({ ...data });
            return data;
        },
        async update({ where, data, }) {
            const idx = findIdx(where);
            if (idx < 0)
                throw new Error("User not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
            users[idx] = { ...users[idx], ...data };
            return users[idx];
        },
    };
}
