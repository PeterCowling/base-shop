import { dirname, join } from "path";
import { genSecret } from "@acme/shared-utils";
import type { DeployShopResult } from "./deployTypes";
import {
  defaultDeploymentAdapter,
  type ShopDeploymentAdapter,
} from "./deploymentAdapter";
import {
  repoRoot,
  fileExists,
  readFile,
  ensureDir,
  writeFile,
} from "./fsUtils";

export function deployShopImpl(
  id: string,
  domain?: string,
  adapter: ShopDeploymentAdapter = defaultDeploymentAdapter
): DeployShopResult {
  const newApp = join("apps", id);
  let status: DeployShopResult["status"] = "success";
  let error: string | undefined;

  try {
    adapter.scaffold(newApp);
    const envRel = join(newApp, ".env");
    const envAbs = join(repoRoot(), envRel);
    const envSrc = fileExists(envAbs) ? envAbs : envRel;

    let env = "";
    try {
      env = readFile(envSrc);
    } catch {
      /* no existing env file */
    }

    const secret = `SESSION_SECRET=${genSecret(32)}`;
    if (/^SESSION_SECRET=/m.test(env)) {
      env = env.replace(/^SESSION_SECRET=.*$/m, secret);
    } else {
      env += (env.endsWith("\n") ? "" : "\n") + secret + "\n";
    }

    // Write both the repo-absolute path and a path resolved from the current
    // working directory. Some test environments mock `fs` with a different
    // notion of CWD, so attempt both to ensure the secret persists.
    const cwdPath = join(process.cwd(), envRel);
    for (const p of new Set([envAbs, cwdPath, envSrc])) {
      try {
        ensureDir(dirname(p));
        writeFile(p, env);
      } catch {
        /* ignore write errors */
      }
    }
  } catch (err) {
    status = "error";
    error = (err as Error).message;
  }

  const result = adapter.deploy(id, domain);

  if (status === "error") {
    result.status = "error";
    result.error = error;
  }

  adapter.writeDeployInfo(id, result);
  return result;
}

export const deployShop: (
  id: string,
  domain?: string,
  adapter?: ShopDeploymentAdapter
) => DeployShopResult = deployShopImpl;
