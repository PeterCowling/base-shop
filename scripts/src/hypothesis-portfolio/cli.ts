import {
  archiveCommand,
  CliCommandError,
  type CommandContext,
  createCommand,
  type FlagMap,
  listCommand,
  portfolioSetCommand,
  rankCommand,
  setStatusCommand,
  updateCommand,
} from "./commands";
import type { HypothesisStorageBackend } from "./storage";

const COMMAND_NAMES = [
  "create",
  "update",
  "list",
  "rank",
  "set-status",
  "archive",
  "portfolio-set",
] as const;

type CommandName = (typeof COMMAND_NAMES)[number];

export interface CliIo {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
}

export interface RunCliOptions {
  backend: HypothesisStorageBackend;
  actor?: string;
  now?: () => Date;
  io?: CliIo;
}

interface ParsedCliInput {
  command: CommandName;
  flags: FlagMap;
}

const DEFAULT_IO: CliIo = {
  stdout: (line: string) => {
     
    console.log(line);
  },
  stderr: (line: string) => {
     
    console.error(line);
  },
};

function printUsage(io: CliIo): void {
  io.stderr("Usage: hypothesis-portfolio <command> [flags]");
  io.stderr("");
  io.stderr("Commands:");
  io.stderr("  create         Create a draft hypothesis");
  io.stderr("  update         Update a hypothesis");
  io.stderr("  list           List hypotheses for a business");
  io.stderr("  rank           Rank hypotheses and show blocked reasons");
  io.stderr("  set-status     Transition lifecycle status (activation guard enforced)");
  io.stderr("  archive        Archive hypothesis");
  io.stderr("  portfolio-set  Create/update portfolio metadata");
  io.stderr("");
  io.stderr("Examples:");
  io.stderr(
    "  hypothesis-portfolio create --business BRIK --title \"Upsell test\" --type offer --prior-confidence 65 --value-unit USD_GROSS_PROFIT --value-horizon-days 90 --upside 12000 --downside 2500 --required-spend 500 --required-effort-days 2 --stopping-rule \"Stop after 7 days if attach rate <2%\"",
  );
  io.stderr("  hypothesis-portfolio set-status --id IDEA-42 --status active --portfolio-card-id BRIK-PORT-1");
  io.stderr("  hypothesis-portfolio rank --business BRIK --portfolio-card-id BRIK-PORT-1 --show-blocked");
}

function isCommandName(value: string): value is CommandName {
  return (COMMAND_NAMES as readonly string[]).includes(value);
}

function parseFlags(tokens: string[]): FlagMap {
  const flags: FlagMap = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      throw new CliCommandError(`unexpected argument: ${token}`);
    }

    const raw = token.slice(2);
    if (!raw) {
      throw new CliCommandError(`invalid flag token: ${token}`);
    }

    const equalsIndex = raw.indexOf("=");
    if (equalsIndex >= 0) {
      const key = raw.slice(0, equalsIndex);
      const value = raw.slice(equalsIndex + 1);
      if (!key) {
        throw new CliCommandError(`invalid flag token: ${token}`);
      }
      flags[key] = value;
      continue;
    }

    const next = tokens[index + 1];
    if (next && !next.startsWith("--")) {
      flags[raw] = next;
      index += 1;
      continue;
    }

    flags[raw] = true;
  }

  return flags;
}

function parseCliInput(argv: string[]): ParsedCliInput {
  if (argv.length === 0) {
    throw new CliCommandError("missing command");
  }

  const [rawCommand, ...rest] = argv;
  if (!isCommandName(rawCommand)) {
    throw new CliCommandError(`unknown command: ${rawCommand}`);
  }

  return {
    command: rawCommand,
    flags: parseFlags(rest),
  };
}

async function dispatchCommand(
  input: ParsedCliInput,
  context: CommandContext,
): Promise<unknown> {
  switch (input.command) {
    case "create":
      return createCommand(context, input.flags);
    case "update":
      return updateCommand(context, input.flags);
    case "list":
      return listCommand(context, input.flags);
    case "rank":
      return rankCommand(context, input.flags);
    case "set-status":
      return setStatusCommand(context, input.flags);
    case "archive":
      return archiveCommand(context, input.flags);
    case "portfolio-set":
      return portfolioSetCommand(context, input.flags);
    default:
      throw new CliCommandError(`unsupported command: ${input.command}`);
  }
}

function isConflictError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("conflict") ||
    normalized.includes("409") ||
    normalized.includes("entity sha") ||
    normalized.includes("entity_sha")
  );
}

export async function runHypothesisPortfolioCli(
  argv: string[],
  options: RunCliOptions,
): Promise<number> {
  const io = options.io ?? DEFAULT_IO;

  if (argv.includes("--help") || argv.includes("-h") || argv[0] === "help") {
    printUsage(io);
    return 0;
  }

  try {
    const parsed = parseCliInput(argv);
    const context: CommandContext = {
      backend: options.backend,
      actor: options.actor,
      now: options.now,
    };

    const result = await dispatchCommand(parsed, context);
    io.stdout(
      JSON.stringify(
        {
          command: parsed.command,
          result,
        },
        null,
        2,
      ),
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof CliCommandError) {
      io.stderr(`Error: ${message}`);
      if (message.startsWith("missing command") || message.startsWith("unknown command")) {
        io.stderr("");
        printUsage(io);
      }
      return 2;
    }

    if (isConflictError(message)) {
      io.stderr(
        "Error: conflict detected while writing hypothesis data. Retry after refreshing the latest hypothesis state.",
      );
      return 3;
    }

    io.stderr(`Error: ${message}`);
    return 1;
  }
}

if (process.argv[1]?.includes("hypothesis-portfolio/cli")) {
   
  console.error(
    "This entrypoint requires an injected HypothesisStorageBackend. Use runHypothesisPortfolioCli(...) from a host script.",
  );
  process.exitCode = 1;
}
