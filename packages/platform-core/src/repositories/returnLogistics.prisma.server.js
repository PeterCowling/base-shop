"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaReturnLogisticsRepository = void 0;
exports.readReturnLogistics = readReturnLogistics;
exports.writeReturnLogistics = writeReturnLogistics;
require("server-only");
const types_1 = require("@acme/types");
const db_1 = require("../db");
const SINGLETON_ID = 1;
async function readReturnLogistics() {
    const row = await db_1.prisma.returnLogistics.findUnique({
        where: { id: SINGLETON_ID },
    });
    if (!row) {
        throw new Error("Return logistics not found"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
    }
    const parsed = types_1.returnLogisticsSchema.safeParse(row.data);
    if (!parsed.success) {
        throw new Error("Invalid return logistics data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
    }
    return parsed.data;
}
async function writeReturnLogistics(data) {
    await db_1.prisma.returnLogistics.upsert({
        where: { id: SINGLETON_ID },
        create: { id: SINGLETON_ID, data },
        update: { data },
    });
}
exports.prismaReturnLogisticsRepository = {
    readReturnLogistics,
    writeReturnLogistics,
};
