import type { Config } from "tailwindcss";
/**
 * Tailwind preset shared across all workspace packages.
 * Since this package does not emit CSS directly, the `content`
 * array is intentionally left empty to satisfy Tailwind’s
 * `RequiredConfig` type without scanning any files here.
 */
declare const preset: Config;
export default preset;
