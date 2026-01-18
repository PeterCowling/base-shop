"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaPricingRepository = void 0;
require("server-only");
const pricing_json_server_1 = require("./pricing.json.server");
// Placeholder Prisma implementation delegating to JSON repository.
exports.prismaPricingRepository = pricing_json_server_1.jsonPricingRepository;
