// /tailwind.config.ts
/**
 * Type-safe wrapper so editors keep autocomplete.
 * Tailwind itself reads **tailwind.config.mjs** at runtime.
 */
import type { Config } from "tailwindcss";
import config from "./tailwind.config.mjs";

export default config as Config;
