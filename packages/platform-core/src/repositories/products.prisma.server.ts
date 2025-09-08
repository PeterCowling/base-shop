import "server-only";

import type { ProductsRepository } from "./products.types";
import { jsonProductsRepository } from "./products.json.server";

// Placeholder Prisma implementation delegating to JSON repository.
export const prismaProductsRepository: ProductsRepository = jsonProductsRepository;
