type EnvRecord = Record<string, string | undefined>;

export function cloneProcessEnv(source: NodeJS.ProcessEnv | EnvRecord): EnvRecord {
  return Object.assign(Object.create(null), source);
}

const importEnvObject = process.env;
const importEnvSnapshot = cloneProcessEnv(process.env);

export function snapshotForCoreEnv(): NodeJS.ProcessEnv {
  if (process.env === importEnvObject) {
    return cloneProcessEnv(process.env) as NodeJS.ProcessEnv;
  }
  return cloneProcessEnv(importEnvSnapshot) as NodeJS.ProcessEnv;
}

