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
exports.readReturnAuthorizations = readReturnAuthorizations;
exports.writeReturnAuthorizations = writeReturnAuthorizations;
exports.addReturnAuthorization = addReturnAuthorization;
exports.getReturnAuthorization = getReturnAuthorization;
require("server-only");
const db_1 = require("../db");
const repoResolver_1 = require("./repoResolver");
let repoPromise;
async function getRepo() {
    if (!repoPromise) {
        repoPromise = (0, repoResolver_1.resolveRepo)(() => db_1.prisma.returnAuthorization, () => Promise.resolve().then(() => __importStar(require("./returnAuthorization.prisma.server"))).then((m) => m.prismaReturnAuthorizationRepository), () => Promise.resolve().then(() => __importStar(require("./returnAuthorization.json.server"))).then((m) => m.jsonReturnAuthorizationRepository), { backendEnvVar: "RETURN_AUTH_BACKEND" });
    }
    return repoPromise;
}
async function readReturnAuthorizations() {
    const repo = await getRepo();
    return repo.readReturnAuthorizations();
}
async function writeReturnAuthorizations(data) {
    const repo = await getRepo();
    return repo.writeReturnAuthorizations(data);
}
async function addReturnAuthorization(ra) {
    const repo = await getRepo();
    return repo.addReturnAuthorization(ra);
}
async function getReturnAuthorization(raId) {
    const repo = await getRepo();
    return repo.getReturnAuthorization(raId);
}
