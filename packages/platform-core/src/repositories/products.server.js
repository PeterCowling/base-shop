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
exports.readRepo = readRepo;
exports.writeRepo = writeRepo;
exports.getProductById = getProductById;
exports.updateProductInRepo = updateProductInRepo;
exports.deleteProductFromRepo = deleteProductFromRepo;
exports.duplicateProductInRepo = duplicateProductInRepo;
require("server-only");
const db_1 = require("../db");
const repoResolver_1 = require("./repoResolver");
let repoPromise;
async function getRepo() {
    if (!repoPromise) {
        repoPromise = (0, repoResolver_1.resolveRepo)(() => db_1.prisma.product, () => Promise.resolve().then(() => __importStar(require("./products.prisma.server"))).then((m) => m.prismaProductsRepository), () => Promise.resolve().then(() => __importStar(require("./products.json.server"))).then((m) => m.jsonProductsRepository), { backendEnvVar: "PRODUCTS_BACKEND" });
    }
    return repoPromise;
}
async function readRepo(shop) {
    const repo = await getRepo();
    return repo.read(shop);
}
async function writeRepo(shop, catalogue) {
    const repo = await getRepo();
    return repo.write(shop, catalogue);
}
async function getProductById(shop, id) {
    const repo = await getRepo();
    return repo.getById(shop, id);
}
async function updateProductInRepo(shop, patch) {
    const repo = await getRepo();
    return repo.update(shop, patch);
}
async function deleteProductFromRepo(shop, id) {
    const repo = await getRepo();
    return repo.delete(shop, id);
}
async function duplicateProductInRepo(shop, id) {
    const repo = await getRepo();
    return repo.duplicate(shop, id);
}
