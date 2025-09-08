type RepoModule<T> = () => Promise<T>;

interface ResolveRepoOptions<T> {
  backendEnvVar?: string;
  sqliteModule?: RepoModule<T>;
}

export async function resolveRepo<T>(
  prismaDelegate: () => unknown | undefined,
  prismaModule: RepoModule<T>,
  jsonModule: RepoModule<T>,
  options: ResolveRepoOptions<T> = {},
): Promise<T> {
  const backendEnvVar = options.backendEnvVar ?? "INVENTORY_BACKEND";
  const backend = backendEnvVar ? process.env[backendEnvVar] : undefined;

  if (backend === "sqlite" && options.sqliteModule) {
    return await options.sqliteModule();
  }

  if (backend === "json") {
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

  return await jsonModule();
}
