import { prisma } from "../db";

type RepoModule<T> = () => Promise<T>;

export async function resolveRepo<T>(
  prismaDelegate: () => unknown | undefined,
  prismaModule: RepoModule<T>,
  jsonModule: RepoModule<T>,
  legacyModule?: RepoModule<T>,
): Promise<T> {
  if (process.env.INVENTORY_BACKEND === "json") {
    return await jsonModule();
  }
  // Use Prisma when DATABASE_URL is set and the model exists
  try {
    if (process.env.DATABASE_URL && prismaDelegate()) {
      return await prismaModule();
    }
  } catch {
    // ignore and fall back
  }
  // legacyModule (sqlite) used only if explicitly set
  if (process.env.INVENTORY_BACKEND === "sqlite" && legacyModule) {
    return await legacyModule();
  }
  return await jsonModule();
}
