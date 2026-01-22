import { parseArgs, type ParsedArgs } from "../utils/args";
import { listPlugins, listProviders, type PluginMeta } from "../utils/providers";

export type ProviderMeta = { id: string; envVars: readonly string[]; name?: string; packageName?: string };

export interface InitShopArgs extends ParsedArgs {
  paymentMeta: ProviderMeta[];
  shippingMeta: ProviderMeta[];
  allPluginMeta: PluginMeta[];
}

export async function initShopArgs(): Promise<InitShopArgs> {
  const args = parseArgs();
  const rootDir = process.cwd();
  const paymentMeta = (await listProviders("payment")) as ProviderMeta[];
  const shippingMeta = (await listProviders("shipping")) as ProviderMeta[];
  const allPluginMeta = listPlugins(rootDir);
  return {
    ...args,
    paymentMeta,
    shippingMeta,
    allPluginMeta,
  };
}
