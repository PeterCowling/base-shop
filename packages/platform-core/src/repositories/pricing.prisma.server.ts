import "server-only";

import { jsonPricingRepository } from "./pricing.json.server";

// Placeholder Prisma implementation delegating to JSON repository.
export const prismaPricingRepository = jsonPricingRepository;
