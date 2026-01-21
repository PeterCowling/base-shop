import { dirname, isAbsolute,join } from "path";

import { genSecret } from "@acme/lib/security";

import {
  defaultDeploymentAdapter,
  type ShopDeploymentAdapter,
} from "./deploymentAdapter";
import type { DeployShopResult } from "./deployTypes";
import {
  ensureDir,
  fileExists,
  readFile,
  repoRoot,
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
    const candidateRoots = new Set<string>();
    const addRoot = (root?: string) => {
      if (!root) return;
      const normalized = isAbsolute(root)
        ? root
        : join(process.cwd(), root);
      try {
        if (fileExists(join(normalized, "apps"))) {
          candidateRoots.add(normalized);
        }
      } catch {
        /* ignore probe failures */
      }
    };

    addRoot(repoRoot());
    let current = process.cwd();
    while (true) {
      addRoot(current);
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }

    const rootCandidates = Array.from(candidateRoots).map((root) =>
      join(root, envRel)
    );
    const readCandidates = [
      ...rootCandidates,
      join(process.cwd(), envRel),
      envRel,
    ];

    let envSrc: string | undefined;
    let env = "";
    for (const candidate of readCandidates) {
      try {
        if (fileExists(candidate)) {
          env = readFile(candidate);
          envSrc = candidate;
          break;
        }
      } catch {
        /* ignore read errors */
      }
    }
    envSrc ??= readCandidates[0];
    if (!envSrc) envSrc = envRel;
    if (!env) {
      try {
        env = readFile(envSrc);
      } catch {
        env = "";
      }
    }

    const secret = `SESSION_SECRET=${genSecret(32)}`;
    if (/^SESSION_SECRET=/m.test(env)) {
      env = env.replace(/^SESSION_SECRET=.*$/m, secret);
    } else {
      env += (env.endsWith("\n") ? "" : "\n") + secret + "\n";
    }

    const writeTargets = new Set<string>([
      ...rootCandidates,
      join(process.cwd(), envRel),
      envRel,
      envSrc,
    ]);
    for (const p of writeTargets) {
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
