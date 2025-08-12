import { envSchema } from "@config/src/env";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ZodError } from "zod";
const shopId = process.argv[2];
if (!shopId) {
    console.error("Usage: pnpm validate-env <shopId>");
    process.exit(1);
}
const envPath = join("apps", `shop-${shopId}`, ".env");
if (!existsSync(envPath)) {
    console.error(`Missing ${envPath}`);
    process.exit(1);
}
const envRaw = readFileSync(envPath, "utf8");
const env = {};
for (const line of envRaw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#"))
        continue;
    const [key, ...rest] = trimmed.split("=");
    env[key] = rest.join("=");
}
Object.keys(env).forEach((k) => {
    if (env[k] === "")
        delete env[k];
});
const depositErrors = [];
for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("DEPOSIT_RELEASE_"))
        continue;
    if (key.includes("ENABLED")) {
        if (value !== "true" && value !== "false") {
            depositErrors.push(`${key} must be true or false`);
        }
    }
    else if (key.includes("INTERVAL_MS")) {
        if (Number.isNaN(Number(value))) {
            depositErrors.push(`${key} must be a number`);
        }
    }
}
if (depositErrors.length) {
    for (const err of depositErrors)
        console.error(err);
    process.exit(1);
}
try {
    envSchema.parse(env);
    console.log("Environment variables look valid.");
}
catch (err) {
    if (err instanceof ZodError) {
        for (const issue of err.issues) {
            const name = issue.path.join(".");
            const message = issue.message === "Required" ? "is required" : issue.message;
            console.error(`${name} ${message}`);
        }
    }
    else {
        console.error(err);
    }
    process.exit(1);
}
