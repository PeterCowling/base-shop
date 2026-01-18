"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readReturnLogistics = readReturnLogistics;
exports.writeReturnLogistics = writeReturnLogistics;
exports.createReturnLabel = createReturnLabel;
require("server-only");
const db_1 = require("../db");
const repoResolver_1 = require("./repoResolver");
let repoPromise;
async function getRepo() {
    if (!repoPromise) {
        repoPromise = (0, repoResolver_1.resolveRepo)(() => db_1.prisma.returnLogistics, () => Promise.resolve().then(() => __importStar(require("./returnLogistics.prisma.server"))).then((m) => m.prismaReturnLogisticsRepository), () => Promise.resolve().then(() => __importStar(require("./returnLogistics.json.server"))).then((m) => m.jsonReturnLogisticsRepository), { backendEnvVar: "RETURN_LOGISTICS_BACKEND" });
    }
    return repoPromise;
}
async function readReturnLogistics() {
    const repo = await getRepo();
    return repo.readReturnLogistics();
}
async function writeReturnLogistics(data) {
    const repo = await getRepo();
    return repo.writeReturnLogistics(data);
}
async function createReturnLabel(req) {
    if (req.carrier !== "UPS") {
        throw new Error("unsupported carrier"); // i18n-exempt -- ABC-123: Server-side validation message, not displayed to end users
    }
    const tracking = `1Z${Math.floor(Math.random() * 1e10)
        .toString()
        .padStart(10, "0")}`;
    const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${tracking}`;
    return { trackingNumber: tracking, labelUrl };
}
