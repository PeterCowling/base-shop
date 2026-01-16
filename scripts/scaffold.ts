#!/usr/bin/env tsx

import { createCli } from "./scaffold/cli";

async function main(): Promise<void> {
  await createCli().parseAsync();
}

main().catch((error) => {
  console.error("❌ Scaffold failed");
  console.error(error);
  process.exit(1);
});