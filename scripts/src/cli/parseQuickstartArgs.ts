// scripts/src/cli/parseQuickstartArgs.ts
// Parse CLI arguments for the quickstart script.

export interface Flags {
  id?: string;
  theme?: string;
  template?: string;
  payment?: string[];
  shipping?: string[];
  seed?: boolean;
  seedFull?: boolean;
  brand?: string;
  tokens?: string;
  autoEnv?: boolean;
  config?: string;
  pagesTemplate?: string;
  presets?: boolean;
  autoPlugins?: boolean;
}

export function parseQuickstartArgs(argv: string[]): Flags {
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (key === "seed") {
        flags.seed = true;
        continue;
      }
      if (key === "seed-full") {
        flags.seedFull = true;
        continue;
      }
      if (key === "auto-env") {
        flags.autoEnv = true;
        continue;
      }
      if (key === "presets") {
        flags.presets = true;
        continue;
      }
      if (key === "auto-plugins") {
        flags.autoPlugins = true;
        continue;
      }
      const val = value ?? argv[++i];
      switch (key) {
        case "id":
        case "shop":
          flags.id = val;
          break;
        case "theme":
          flags.theme = val;
          break;
        case "template":
          flags.template = val;
          break;
        case "pages-template":
          flags.pagesTemplate = val;
          break;
        case "payment":
          flags.payment = val ? val.split(",").map((s) => s.trim()) : [];
          break;
        case "shipping":
          flags.shipping = val ? val.split(",").map((s) => s.trim()) : [];
          break;
        case "brand":
          flags.brand = val;
          break;
        case "tokens":
          flags.tokens = val;
          break;
        case "config":
          flags.config = val;
          break;
        default:
          console.error(`Unknown option --${key}`);
          process.exit(1);
      }
    } else if (!flags.id) {
      flags.id = arg;
    }
  }
  return flags;
}
