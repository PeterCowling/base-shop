import { envSchema } from "@config/env";
try {
    envSchema.parse(process.env);
    console.log("Environment variables look valid.");
}
catch (err) {
    console.error("Invalid environment variables:\n", err);
    process.exit(1);
}
