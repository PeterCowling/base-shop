import "server-only";

import { jsonGuidesRepository } from "./guides.json.server";
import type { GuidesRepository } from "./guides.types";

// Placeholder Prisma implementation delegating to JSON repository.
export const prismaGuidesRepository: GuidesRepository = jsonGuidesRepository;
