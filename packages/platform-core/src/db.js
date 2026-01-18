"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.createTestPrismaStub = createTestPrismaStub;
exports.loadPrismaClient = loadPrismaClient;
const module_1 = require("module");
const core_1 = require("@acme/config/env/core");
const stubs_1 = require("./db/stubs");
/**
 * Avoid augmenting `PrismaClient` with a permissive index signature.
 * For dynamic model access, use a typed helper instead.
 * See `docs/contributing.md#prisma-model-access` for details:
 *
 * ```ts
 * function getModelDelegate<K extends keyof PrismaClient>(
 *   client: PrismaClient,
 *   model: K,
 * ): PrismaClient[K] {
 *   return client[model];
 * }
 * ```
 */
function createTestPrismaStub() {
    const stub = {
        rentalOrder: (0, stubs_1.createRentalOrderDelegate)(),
        shop: (0, stubs_1.createShopDelegate)(),
        page: (0, stubs_1.createPageDelegate)(),
        customerProfile: (0, stubs_1.createCustomerProfileDelegate)(),
        customerIdentity: (0, stubs_1.createCustomerIdentityDelegate)(),
        customerStripeMapping: (0, stubs_1.createCustomerStripeMappingDelegate)(),
        stripeWebhookEvent: (0, stubs_1.createStripeWebhookEventDelegate)(),
        customerMfa: (0, stubs_1.createCustomerMfaDelegate)(),
        subscriptionUsage: (0, stubs_1.createSubscriptionUsageDelegate)(),
        user: (0, stubs_1.createUserDelegate)(),
        reverseLogisticsEvent: (0, stubs_1.createReverseLogisticsEventDelegate)(),
        product: (0, stubs_1.createProductDelegate)(),
        inventoryItem: (0, stubs_1.createInventoryItemDelegate)(),
        sectionTemplate: (0, stubs_1.createSectionTemplateDelegate)(),
    };
    stub.$transaction = async (fn) => fn(stub);
    return stub;
}
function resolveRequire() {
    const globalRequire = globalThis.require;
    if (typeof globalRequire === "function") {
        return globalRequire;
    }
    if (typeof __filename === "string") {
        try {
            return (0, module_1.createRequire)(__filename);
        }
        catch {
            // ignore and fall back to cwd based resolution
        }
    }
    try {
        return (0, module_1.createRequire)(process.cwd() + "/");
    }
    catch {
        return undefined;
    }
}
let PrismaCtor;
function loadPrismaClient() {
    if (PrismaCtor !== undefined)
        return PrismaCtor;
    try {
        const req = resolveRequire();
        if (!req) {
            PrismaCtor = undefined;
            return PrismaCtor;
        }
        const modAny = req("@prisma/client"); // i18n-exempt -- DS-0001 Module identifier string, not user-facing copy
        const reqMod = modAny;
        PrismaCtor = reqMod.PrismaClient;
    }
    catch {
        PrismaCtor = undefined;
    }
    return PrismaCtor;
}
let DATABASE_URL;
try {
    ({ DATABASE_URL } = (0, core_1.loadCoreEnv)());
}
catch {
    // Fall back to raw process.env when core env validation fails in tests
    DATABASE_URL = process.env.DATABASE_URL;
}
// Ensure direct env var takes precedence when core env omits DATABASE_URL
if (!DATABASE_URL && typeof process.env.DATABASE_URL === "string") {
    DATABASE_URL = process.env.DATABASE_URL;
}
const useStub = process.env.NODE_ENV === "test" || !DATABASE_URL;
const prisma = useStub
    ? createTestPrismaStub()
    : (() => {
        const PC = loadPrismaClient();
        if (!PC) {
            return createTestPrismaStub();
        }
        return new PC({ datasources: { db: { url: DATABASE_URL } } });
    })();
exports.prisma = prisma;
