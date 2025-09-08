import "server-only";

import type { CouponsRepository } from "./coupons.json.server";
import { jsonCouponsRepository } from "./coupons.json.server";

// Placeholder Prisma implementation delegating to JSON repository.
export const prismaCouponsRepository: CouponsRepository = jsonCouponsRepository;

