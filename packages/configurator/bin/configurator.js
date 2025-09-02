#!/usr/bin/env node

// packages/configurator/bin/configurator.js

import { spawnSync } from "node:child_process";

const required = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "CART_COOKIE_SECRET",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const [, , cmd] = process.argv;

function run(bin, args) {
  const result = spawnSync(bin, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

switch (cmd) {
  case "dev":
    run("vite", ["dev"]);
    break;
  case "build":
    run("vite", ["build"]);
    break;
  case "deploy":
    run("wrangler", ["pages", "deploy", ".vercel/output/static"]);
    break;
  default:
    console.log("Usage: pnpm configurator <dev|build|deploy>");
    process.exit(1);
}

