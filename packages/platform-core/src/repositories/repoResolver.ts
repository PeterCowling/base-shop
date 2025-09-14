type RepoModule<T> = () => Promise<T>;

export interface ResolveRepoOptions {
  backendEnvVar?: string;
}

export async function resolveRepo<T>(
  prismaDelegate: () => unknown | undefined,
  prismaModule: RepoModule<T>,
  jsonModule: RepoModule<T>,
  options: ResolveRepoOptions = {},
): Promise<T> {
  const envVarName = options.backendEnvVar ?? "INVENTORY_BACKEND";
  const backend = envVarName && process.env[envVarName]
    ? process.env[envVarName]
    : process.env.DB_MODE;

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
