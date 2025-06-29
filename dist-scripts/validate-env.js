"use strict";
var env_1 = require("@acme/config/env");
try {
  env_1.envSchema.parse(process.env);
  console.log("Environment variables look valid.");
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}
