/**
 * S2 Operator Capture Orchestrator
 *
 * Ties together parity capture scripts (Direct, Hostelworld, Booking.com) with the
 * economics pipeline to generate three dated CSV artifacts:
 * - YYYY-MM-DD-parity-scenarios.csv (from parity capture scripts)
 * - YYYY-MM-DD-bookings-by-channel.csv (from Octorate economics)
 * - YYYY-MM-DD-commission-by-channel.csv (derived from bookings-by-channel)
 *
 * Usage:
 *   pnpm --filter ./scripts tsx src/startup-loop/s2-operator-capture.ts --as-of YYYY-MM-DD [--output-dir path] [--replace-empty-scaffold]
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

import { computeHospitalityScenarioInputs } from "./hospitality-scenarios.js";

const execFileAsync = promisify(execFile);

// Use process.cwd() to work in both ESM and CJS (Jest)
// Assumes script is run from monorepo root (standard practice)
const REPO_ROOT = process.cwd();
const DEFAULT_OUTPUT_DIR = join(REPO_ROOT, "docs/business-os/market-research/BRIK/data");
const MCP_SERVER_DIR = join(REPO_ROOT, "packages/mcp-server");

export type ParsedArgs = {
  asOf: string;
  outputDir: string;
  replaceEmptyScaffold: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const args = Array.isArray(argv) ? argv.slice() : [];

  const parsed = {
    asOf: null as string | null,
    outputDir: DEFAULT_OUTPUT_DIR,
    replaceEmptyScaffold: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (token === "--as-of") {
      parsed.asOf = args[i + 1] ?? null;
      i += 1;
      continue;
    }

    if (token === "--output-dir") {
      parsed.outputDir = args[i + 1] ?? DEFAULT_OUTPUT_DIR;
      i += 1;
      continue;
    }

    if (token === "--replace-empty-scaffold") {
      parsed.replaceEmptyScaffold = true;
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`unknown_arg:${token}`);
    }
  }

  if (!parsed.asOf) {
    throw new Error("missing_required_arg:--as-of");
  }

  return parsed as ParsedArgs;
}

export function computeOutputFileNames(asOf: string): {
  parityScenarios: string;
  bookingsByChannel: string;
  commissionByChannel: string;
} {
  return {
    parityScenarios: `${asOf}-parity-scenarios.csv`,
    bookingsByChannel: `${asOf}-bookings-by-channel.csv`,
    commissionByChannel: `${asOf}-commission-by-channel.csv`,
  };
}

export async function isFileEmpty(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");

    // Header-only file
    if (lines.length <= 1) {
      return true;
    }

    // Check if all data rows contain "unavailable" (scaffold-empty pattern)
    const dataLines = lines.slice(1);
    const allUnavailable = dataLines.every((line) => line.includes("unavailable"));

    return allUnavailable;
  } catch {
    // File doesn't exist or can't be read
    return true;
  }
}

export async function shouldOverwrite(
  filePath: string,
  replaceEmptyScaffold: boolean
): Promise<boolean> {
  try {
    await fs.access(filePath);
    // File exists
    if (replaceEmptyScaffold) {
      return await isFileEmpty(filePath);
    }
    return false;
  } catch {
    // File doesn't exist - allow write
    return true;
  }
}

export async function verifyOutputExists(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      const stat = await fs.stat(filePath);
      if (stat.size === 0) {
        throw new Error(`output_empty:${filePath}`);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`output_missing:${filePath}`);
      }
      throw err;
    }
  }
}

export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, content, "utf-8");
  await fs.rename(tmpPath, filePath);
}

async function runParityCapture(
  scriptName: string,
  args: string[],
  description: string
): Promise<void> {
  console.log(`Running ${description}...`);
  const scriptPath = join(MCP_SERVER_DIR, scriptName);

  try {
    const { stdout, stderr } = await execFileAsync("node", [scriptPath, ...args], {
      cwd: MCP_SERVER_DIR,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (stdout) {
      console.log(`${description} stdout:`, stdout.trim());
    }
    if (stderr) {
      console.error(`${description} stderr:`, stderr.trim());
    }

    console.log(`${description} completed successfully.`);
  } catch (err) {
    console.error(`${description} failed:`, err);
    throw new Error(`parity_capture_failed:${scriptName}`);
  }
}

async function deriveCommissionFromBookings(
  bookingsByChannelFile: string,
  commissionByChannelFile: string
): Promise<void> {
  console.log("Deriving commission from bookings-by-channel...");

  // Import the commission derivation functions
  const commissionModPath = join(
    REPO_ROOT,
    "packages/mcp-server/dist/startup-loop/commission.js"
  );
  const bookingsModPath = join(
    REPO_ROOT,
    "packages/mcp-server/dist/startup-loop/octorate-bookings.js"
  );
  const ratesConfigPath = join(
    REPO_ROOT,
    "packages/mcp-server/src/startup-loop/commission-rates.json"
  );

  let commissionMod: any;
  let bookingsMod: any;
  try {
    commissionMod = await import(commissionModPath);
    bookingsMod = await import(bookingsModPath);
  } catch (err) {
    throw new Error(
      `missing_dist_build: Run pnpm --filter @acme/mcp-server build. Error: ${err}`
    );
  }

  const { deriveCommissionByChannel, commissionByChannelRowsToCsv } = commissionMod;
  const { parseBookingsByChannelCsv } = bookingsMod;

  // Read bookings-by-channel CSV
  const bookingsCsv = await fs.readFile(bookingsByChannelFile, "utf-8");
  const bookingsRows = parseBookingsByChannelCsv(bookingsCsv);

  // Read commission rates config
  const ratesConfig = JSON.parse(await fs.readFile(ratesConfigPath, "utf-8"));

  // Derive commission
  const commissionRows = deriveCommissionByChannel(bookingsRows, ratesConfig);
  const commissionCsv = commissionByChannelRowsToCsv(commissionRows);

  // Write commission CSV atomically
  await atomicWrite(commissionByChannelFile, commissionCsv);

  console.log(`Commission derived: ${commissionRows.length} rows written.`);
}

async function runOctorateEconomics(
  asOf: string,
  outputDir: string,
  bookingsByChannelFile: string,
  commissionByChannelFile: string
): Promise<void> {
  console.log("Running Octorate economics pipeline...");

  // Step 1: Export from Octorate (check-in time filter, last 12 months)
  const exportScript = join(MCP_SERVER_DIR, "octorate-export-final-working.mjs");
  const exportedFile = join(MCP_SERVER_DIR, "octorate_export.xlsx");

  // Compute date range: last 12 complete check-in months
  const asOfDate = new Date(asOf);
  const endMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth() - 1, 1);
  const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - 11, 1);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDate = formatDate(startMonth);
  const endDate = formatDate(new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0)); // Last day of month

  console.log(`Exporting Octorate data from ${startDate} to ${endDate} (check-in filter)...`);

  try {
    const { stdout, stderr } = await execFileAsync(
      "node",
      [exportScript, "--time-filter", "check_in", "--start", startDate, "--end", endDate],
      {
        cwd: MCP_SERVER_DIR,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stdout) console.log("Export stdout:", stdout.trim());
    if (stderr) console.error("Export stderr:", stderr.trim());
  } catch (err) {
    console.error("Octorate export failed:", err);
    throw new Error("octorate_export_failed");
  }

  // Step 2: Process bookings with --emit-bookings-by-channel
  const processScript = join(MCP_SERVER_DIR, "octorate-process-bookings.mjs");

  console.log("Processing bookings by channel...");

  try {
    const { stdout, stderr } = await execFileAsync(
      "node",
      [processScript, exportedFile, outputDir, "--as-of", asOf, "--emit-bookings-by-channel"],
      {
        cwd: MCP_SERVER_DIR,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stdout) console.log("Process stdout:", stdout.trim());
    if (stderr) console.error("Process stderr:", stderr.trim());
  } catch (err) {
    console.error("Octorate processing failed:", err);
    throw new Error("octorate_process_failed");
  }

  // Step 3: Derive commission from bookings-by-channel
  await deriveCommissionFromBookings(bookingsByChannelFile, commissionByChannelFile);

  console.log("Economics pipeline completed.");
}

export async function orchestrate(args: ParsedArgs): Promise<void> {
  const { asOf, outputDir, replaceEmptyScaffold } = args;

  console.log(`S2 Operator Capture Orchestrator starting...`);
  console.log(`  as-of: ${asOf}`);
  console.log(`  output-dir: ${outputDir}`);
  console.log(`  replace-empty-scaffold: ${replaceEmptyScaffold}`);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Compute output file names
  const fileNames = computeOutputFileNames(asOf);
  const parityFile = join(outputDir, fileNames.parityScenarios);
  const bookingsFile = join(outputDir, fileNames.bookingsByChannel);
  const commissionFile = join(outputDir, fileNames.commissionByChannel);

  // Check overwrite constraints
  const canOverwriteParity = await shouldOverwrite(parityFile, replaceEmptyScaffold);
  const canOverwriteBookings = await shouldOverwrite(bookingsFile, replaceEmptyScaffold);
  const canOverwriteCommission = await shouldOverwrite(commissionFile, replaceEmptyScaffold);

  if (!canOverwriteParity) {
    throw new Error(`output_exists_no_overwrite:${parityFile}`);
  }
  if (!canOverwriteBookings) {
    throw new Error(`output_exists_no_overwrite:${bookingsFile}`);
  }
  if (!canOverwriteCommission) {
    throw new Error(`output_exists_no_overwrite:${commissionFile}`);
  }

  // Step 1: Compute scenario inputs once
  console.log("Computing hospitality scenario inputs...");
  const scenarios = computeHospitalityScenarioInputs(asOf);

  // Step 2: Run parity capture scripts for all three channels and scenarios
  console.log("Running parity capture for all scenarios...");

  for (const [scenarioKey, scenario] of Object.entries(scenarios)) {
    const scenarioName = scenarioKey.toUpperCase();

    // Direct
    await runParityCapture(
      "octorate-parity-direct.mjs",
      [
        "--as-of",
        asOf,
        "--output-dir",
        outputDir,
        "--scenario",
        scenarioName,
        "--check-in",
        scenario.checkIn,
        "--check-out",
        scenario.checkOut,
        "--pax",
        String(scenario.travellers),
      ],
      `Parity capture (Direct, ${scenarioName})`
    );

    // Hostelworld
    await runParityCapture(
      "hostelworld-parity.mjs",
      [
        "--as-of",
        asOf,
        "--output-dir",
        outputDir,
        "--scenario",
        scenarioName,
        "--check-in",
        scenario.checkIn,
        "--check-out",
        scenario.checkOut,
        "--pax",
        String(scenario.travellers),
      ],
      `Parity capture (Hostelworld, ${scenarioName})`
    );

    // Booking.com
    await runParityCapture(
      "bookingcom-parity.mjs",
      [
        "--as-of",
        asOf,
        "--output-dir",
        outputDir,
        "--scenario",
        scenarioName,
        "--check-in",
        scenario.checkIn,
        "--check-out",
        scenario.checkOut,
        "--pax",
        String(scenario.travellers),
      ],
      `Parity capture (Booking.com, ${scenarioName})`
    );
  }

  // Step 3: Run Octorate economics pipeline
  await runOctorateEconomics(asOf, outputDir, bookingsFile, commissionFile);

  // Step 4: Verify all outputs exist and are non-empty
  console.log("Verifying outputs...");
  await verifyOutputExists([parityFile, bookingsFile, commissionFile]);

  console.log("S2 Operator Capture Orchestrator completed successfully!");
  console.log(`  Parity scenarios: ${parityFile}`);
  console.log(`  Bookings by channel: ${bookingsFile}`);
  console.log(`  Commission by channel: ${commissionFile}`);
}

// CLI entrypoint removed - use the .mjs wrapper (s2-operator-capture.mjs) for direct execution
// The entry point check using import.meta.url causes Jest CJS parsing errors
