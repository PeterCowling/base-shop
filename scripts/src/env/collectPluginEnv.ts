import { execSync } from "node:child_process";

import { prompt, selectProviders } from "../utils/prompts";
import type { PluginMeta } from "../utils/providers";

const PLUGIN_DOC_PATH = "docs/plugins.md";

function formatPluginName(id: string): string {
  return id
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

interface CollectPluginEnvParams {
  payment: string[];
  shipping: string[];
  paymentMeta: PluginMeta[];
  shippingMeta: PluginMeta[];
  allPluginMeta: PluginMeta[];
  configPlugins: string[];
  envFileVars: Record<string, string>;
  vaultCmd?: string;
  autoEnv: boolean;
  skipPrompts: boolean;
}

interface CollectPluginEnvResult {
  selectedPlugins: Set<string>;
  pluginMap: Map<string, { packageName?: string; envVars: readonly string[] }>;
  envVars: Record<string, string>;
  requiredEnvKeys: Set<string>;
  unusedEnvFileKeys: string[];
}

export async function collectPluginEnv(
  params: CollectPluginEnvParams,
): Promise<CollectPluginEnvResult> {
  const {
    payment,
    shipping,
    paymentMeta,
    shippingMeta,
    allPluginMeta,
    configPlugins,
    envFileVars,
    vaultCmd,
    autoEnv,
    skipPrompts,
  } = params;

  const pluginMap = new Map<
    string,
    { packageName?: string; envVars: readonly string[] }
  >();
  for (const m of [...paymentMeta, ...shippingMeta, ...allPluginMeta]) {
    pluginMap.set(m.id, { packageName: m.packageName, envVars: m.envVars });
  }

  const selectedPlugins = new Set<string>([...payment, ...shipping]);
  const optionalPlugins = allPluginMeta.filter((p) => !selectedPlugins.has(p.id));
  let extra: string[] = configPlugins;
  if (!extra.length && optionalPlugins.length && !skipPrompts) {
    extra = await selectProviders(
      "plugins",
      optionalPlugins.map((p) => p.id),
    );
  }
  extra.forEach((id) => selectedPlugins.add(id));

  const envVars: Record<string, string> = {};
  const requiredEnvKeys = new Set<string>();
  const usedEnvFileKeys = new Set<string>();
  const remindedAboutDocs = new Set<string>();

  for (const id of selectedPlugins) {
    const vars = pluginMap.get(id)?.envVars ?? [];
    for (const key of vars) {
      requiredEnvKeys.add(key);
      if (envFileVars[key] !== undefined) {
        envVars[key] = envFileVars[key];
        usedEnvFileKeys.add(key);
        continue;
      }
      if (vaultCmd) {
        try {
          const val = execSync(`${vaultCmd} ${key}`, {
            encoding: "utf8",
          }).trim();
          if (val) {
            envVars[key] = val;
            continue;
          }
        } catch {}
      }
      if (!autoEnv && !skipPrompts) {
        if (!remindedAboutDocs.has(id)) {
          const friendlyName = formatPluginName(id) || id;
          console.log(
            `Refer to ${PLUGIN_DOC_PATH}#${id}-plugin for guidance on ${friendlyName} credentials.`,
          );
          remindedAboutDocs.add(id);
        }
        envVars[key] = await prompt(`${key}: `, "");
      } else {
        envVars[key] = `TODO_${key}`;
      }
    }
  }
  const unusedEnvFileKeys = Object.keys(envFileVars).filter(
    (k) => !usedEnvFileKeys.has(k),
  );

  return {
    selectedPlugins,
    pluginMap,
    envVars,
    requiredEnvKeys,
    unusedEnvFileKeys,
  };
}
