type RepoModule<T> = () => Promise<T>;

export interface ResolveRepoOptions {
  backendEnvVar?: string;
}

type BackendKind = "prisma" | "json";

function normalizeBackend(value: string | undefined): BackendKind | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return normalized === "prisma" || normalized === "json"
    ? (normalized as BackendKind)
    : undefined;
}

function assertPrismaConfiguration(
  prismaDelegate: () => unknown | undefined,
  sourceLabel: string,
): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      `Prisma backend selected via ${sourceLabel} but DATABASE_URL is not set.`,
    );
  }

  let delegate: unknown;
  try {
    delegate = prismaDelegate();
  } catch (error) {
    throw new Error(
      `Prisma backend selected via ${sourceLabel} but Prisma client is not available.`,
      error instanceof Error ? { cause: error } : undefined,
    );
  }

  if (!delegate) {
    throw new Error(
      `Prisma backend selected via ${sourceLabel} but Prisma model delegate is missing.`,
    );
  }
}

export async function resolveRepo<T>(
  prismaDelegate: () => unknown | undefined,
  prismaModule: RepoModule<T>,
  jsonModule: RepoModule<T>,
  options: ResolveRepoOptions = {},
): Promise<T> {
  const envVarName = options.backendEnvVar ?? "INVENTORY_BACKEND";
  const rawBackend = envVarName ? process.env[envVarName] : undefined;
  const rawDbMode = process.env.DB_MODE;
  const backend = normalizeBackend(rawBackend);
  const dbMode = normalizeBackend(rawDbMode);

  if (rawBackend && !backend) {
    throw new Error(
      `Unsupported backend "${rawBackend}" for ${envVarName}. Expected "prisma" or "json".`,
    );
  }
  if (!backend && rawDbMode && !dbMode) {
    throw new Error(
      `Unsupported backend "${rawDbMode}" for DB_MODE. Expected "prisma" or "json".`,
    );
  }

  const explicitBackend = backend ?? dbMode;

  if (explicitBackend) {
    const sourceLabel = backend ? envVarName ?? "DB_MODE" : "DB_MODE";

    if (explicitBackend === "json") {
      return await jsonModule();
    }

    // explicitBackend === "prisma"
    assertPrismaConfiguration(prismaDelegate, sourceLabel);
    return await prismaModule();
  }

  // Legacy auto-detection path for environments that have not yet set
  // *_BACKEND or DB_MODE. Preserve historical behaviour:
  // - Prefer Prisma when DATABASE_URL is set and the model delegate exists.
  // - Fall back to JSON otherwise.
  try {
    if (process.env.DATABASE_URL && prismaDelegate()) {
      return await prismaModule();
    }
  } catch {
    // ignore and fall back to JSON
  }

  return await jsonModule();
}
