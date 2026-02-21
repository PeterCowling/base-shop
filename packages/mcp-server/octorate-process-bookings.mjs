#!/usr/bin/env node

/**
 * Octorate bookings data processor.
 *
 * Processes Octorate reservations Excel export into monthly aggregates:
 * - Deduplicates by booking reference (Refer column)
 * - Aggregates by create time month
 * - Calculates channel attribution (Direct vs OTA) using the legacy room-name heuristic
 * - Outputs bookings_by_month.csv and net_value_by_month.csv
 *
 * Optional (S2 support): emit a dated bookings-by-channel CSV (check-in month + Refer-based channel).
 *
 * Usage:
 *   node octorate-process-bookings.mjs <input-file.xls> [output-dir] [--as-of YYYY-MM-DD] [--emit-bookings-by-channel]
 *
 * Prereqs:
 *   - pnpm install (exceljs must be available)
 *   - pnpm --filter @acme/mcp-server build (required for bookings-by-channel output)
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_OUTPUT_DIR = join(__dirname, "../../docs/business-os/strategy/BRIK/data");

function isoFromLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    // Try parsing as ISO date or Excel date string
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

function formatYearMonth(date) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseValue(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function isDirectBooking(roomName) {
  // Direct bookings won't have "OTA" in the room name.
  // Based on existing data, all OTA bookings have "OTA" prefix in room column.
  if (typeof roomName !== "string") return false;
  return !roomName.toLowerCase().includes("ota");
}

function parseLegacyBookings(ws) {
  const bookings = [];
  let skippedRows = 0;

  // Skip header row (row 1)
  for (let rowNum = 2; rowNum <= ws.rowCount; rowNum += 1) {
    const row = ws.getRow(rowNum);

    const createTime = parseDate(row.getCell(1).value);
    const refer = row.getCell(4).value;
    const room = row.getCell(7).value;
    const totalRoom = parseValue(row.getCell(8).value);

    if (!createTime || !refer) {
      skippedRows += 1;
      continue;
    }

    const yearMonth = formatYearMonth(createTime);
    if (!yearMonth) {
      skippedRows += 1;
      continue;
    }

    const isDirect = isDirectBooking(room);

    bookings.push({
      createTime,
      yearMonth,
      refer: String(refer).trim(),
      room: String(room || ""),
      value: totalRoom,
      isDirect,
    });
  }

  return { bookings, skippedRows };
}

function dedupeLegacyBookings(bookings) {
  // Deduplicate by month + refer, keeping first occurrence (earliest row).
  const uniqueBookings = new Map();

  for (const booking of bookings) {
    const key = `${booking.yearMonth}|${booking.refer}`;
    if (!uniqueBookings.has(key)) {
      uniqueBookings.set(key, booking);
    }
  }

  const deduped = Array.from(uniqueBookings.values());
  const duplicatesRemoved = bookings.length - deduped.length;

  return { deduped, duplicatesRemoved };
}

function aggregateLegacyByMonth(bookings, deduped) {
  const monthlyData = new Map();

  for (const booking of deduped) {
    if (!monthlyData.has(booking.yearMonth)) {
      monthlyData.set(booking.yearMonth, {
        month: booking.yearMonth,
        bookingsCount: 0,
        grossValue: 0,
        directCount: 0,
        otaCount: 0,
        rawRows: 0,
        duplicatesRemoved: 0,
      });
    }

    const data = monthlyData.get(booking.yearMonth);
    data.bookingsCount += 1;
    data.grossValue += booking.value;

    if (booking.isDirect) {
      data.directCount += 1;
    } else {
      data.otaCount += 1;
    }
  }

  // Calculate duplicates per month.
  for (const booking of bookings) {
    if (monthlyData.has(booking.yearMonth)) {
      monthlyData.get(booking.yearMonth).rawRows += 1;
    }
  }

  for (const data of monthlyData.values()) {
    data.duplicatesRemoved = data.rawRows - data.bookingsCount;
  }

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function buildBookingsByMonthCsv(sortedMonths, inputPath) {
  const rows = ["month,bookings_count,gross_booking_value,channel_source,notes"];

  for (const data of sortedMonths) {
    const channelStr =
      data.directCount > 0 && data.otaCount > 0
        ? `Direct:${data.directCount}; OTA:${data.otaCount}`
        : data.directCount > 0
          ? `Direct:${data.directCount}`
          : `OTA:${data.otaCount}`;

    const notes = `observed from ${inputPath.split("/").pop()}; raw_rows=${data.rawRows}; duplicate_refs_removed=${data.duplicatesRemoved}`;

    rows.push(`${data.month},${data.bookingsCount},${data.grossValue.toFixed(2)},${channelStr},${notes}`);
  }

  return rows;
}

function buildNetValueByMonthCsv(sortedMonths, inputPath) {
  const rows = ["month,net_booking_value,method,notes"];

  for (const data of sortedMonths) {
    const method = "observed export marked net-of-cancellations; deduped by Refer per month";
    const notes = `observed from ${inputPath.split("/").pop()}; raw_rows=${data.rawRows}; duplicate_refs_removed=${data.duplicatesRemoved}`;

    rows.push(`${data.month},${data.grossValue.toFixed(2)},${method},${notes}`);
  }

  return rows;
}

async function writeLegacyOutputs(outputDir, bookingsCsvRows, netValueCsvRows) {
  await fs.mkdir(outputDir, { recursive: true });

  const bookingsPath = join(outputDir, "bookings_by_month.csv");
  const netValuePath = join(outputDir, "net_value_by_month.csv");

  await fs.writeFile(bookingsPath, bookingsCsvRows.join("\n") + "\n", "utf-8");
  await fs.writeFile(netValuePath, netValueCsvRows.join("\n") + "\n", "utf-8");

  return { bookingsPath, netValuePath };
}

async function writeBookingsByChannelOutput(ws, outputDir, asOfIso) {
  let mod;
  try {
    mod = await import("./dist/startup-loop/octorate-bookings.js");
  } catch {
    throw new Error(
      "Missing dist build for bookings-by-channel output. Run: pnpm --filter @acme/mcp-server build",
    );
  }

  const { aggregateBookingsByChannel, bookingsByChannelRowsToCsv } = mod;

  const reservations = [];
  let skippedChannelRows = 0;

  for (let rowNum = 2; rowNum <= ws.rowCount; rowNum += 1) {
    const row = ws.getRow(rowNum);

    const createTime = parseDate(row.getCell(1).value);
    const checkIn = parseDate(row.getCell(2).value);
    const refer = row.getCell(4).value;
    const room = row.getCell(7).value;
    const totalRoom = parseValue(row.getCell(8).value);

    if (!createTime || !checkIn || !refer) {
      skippedChannelRows += 1;
      continue;
    }

    reservations.push({
      createTime,
      checkIn,
      refer: String(refer).trim(),
      room: String(room || ""),
      totalRoom,
    });
  }

  if (skippedChannelRows > 0) {
    console.info(`Bookings-by-channel: skipped ${skippedChannelRows} rows (missing create/check-in/reference)`);
  }

  const rows = aggregateBookingsByChannel(reservations, { asOfIso });
  const csv = bookingsByChannelRowsToCsv(rows);

  const bookingsByChannelPath = join(outputDir, `${asOfIso}-bookings-by-channel.csv`);
  await fs.writeFile(bookingsByChannelPath, csv, "utf-8");

  return bookingsByChannelPath;
}

async function processExcel(inputPath, outputDir, options) {
  console.info("Octorate Bookings Processor");
  console.info("==========================\n");
  console.info(`Input file: ${inputPath}`);
  console.info(`Output directory: ${outputDir}\n`);

  const emitBookingsByChannel = Boolean(options?.emitBookingsByChannel);
  const asOfIso = String(options?.asOfIso ?? isoFromLocalDate(new Date()));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(inputPath);
  const ws = wb.worksheets[0];

  console.info(`Loaded sheet: ${ws.name}`);
  console.info(`Total rows: ${ws.rowCount}\n`);

  const { bookings, skippedRows } = parseLegacyBookings(ws);

  console.info(`Parsed ${bookings.length} booking records`);
  if (skippedRows > 0) {
    console.info(`Skipped ${skippedRows} rows (missing date or reference)\n`);
  } else {
    console.info("");
  }

  const { deduped, duplicatesRemoved } = dedupeLegacyBookings(bookings);
  console.info(`After deduplication: ${deduped.length} unique bookings`);
  console.info(`Duplicates removed: ${duplicatesRemoved}\n`);

  const sortedMonths = aggregateLegacyByMonth(bookings, deduped);
  if (sortedMonths.length === 0) {
    throw new Error("No monthly aggregates produced (empty export?)");
  }

  console.info(`Aggregated into ${sortedMonths.length} months`);
  console.info(
    `Date range: ${sortedMonths[0].month} to ${sortedMonths[sortedMonths.length - 1].month}\n`,
  );

  const bookingsCsvRows = buildBookingsByMonthCsv(sortedMonths, inputPath);
  const netValueCsvRows = buildNetValueByMonthCsv(sortedMonths, inputPath);

  const { bookingsPath, netValuePath } = await writeLegacyOutputs(outputDir, bookingsCsvRows, netValueCsvRows);

  console.info("Output files written:");
  console.info(`  ${bookingsPath}`);
  console.info(`  ${netValuePath}\n`);

  if (emitBookingsByChannel) {
    const bookingsByChannelPath = await writeBookingsByChannelOutput(ws, outputDir, asOfIso);
    console.info("Additional output written:");
    console.info(`  ${bookingsByChannelPath}\n`);
  }

  const totalBookings = sortedMonths.reduce((sum, m) => sum + m.bookingsCount, 0);
  const totalValue = sortedMonths.reduce((sum, m) => sum + m.grossValue, 0);
  const totalDirect = sortedMonths.reduce((sum, m) => sum + m.directCount, 0);
  const totalOta = sortedMonths.reduce((sum, m) => sum + m.otaCount, 0);

  console.info("Summary:");
  console.info(`  Total bookings: ${totalBookings}`);
  console.info(`  Total value: ${totalValue.toFixed(2)}`);
  console.info(`  Direct: ${totalDirect} (${((totalDirect / totalBookings) * 100).toFixed(1)}%)`);
  console.info(`  OTA: ${totalOta} (${((totalOta / totalBookings) * 100).toFixed(1)}%)`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      "Usage: node octorate-process-bookings.mjs <input-file.xls> [output-dir] [--as-of YYYY-MM-DD] [--emit-bookings-by-channel]",
    );
    console.error("");
    console.error("Example:");
    console.error("  node octorate-process-bookings.mjs /Users/pete/Downloads/export_19519177.xls");
    console.error(
      "  node octorate-process-bookings.mjs ./export.xls ./output --as-of 2026-02-15 --emit-bookings-by-channel",
    );
    process.exit(1);
  }

  const positionals = [];
  let asOfIso = null;
  let emitBookingsByChannel = false;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--as-of") {
      asOfIso = args[i + 1];
      i += 1;
      continue;
    }
    if (token === "--emit-bookings-by-channel") {
      emitBookingsByChannel = true;
      continue;
    }
    if (token.startsWith("--")) {
      console.error(`Unknown arg: ${token}`);
      process.exit(1);
    }
    positionals.push(token);
  }

  const inputPath = positionals[0];
  const outputDir = positionals[1] || DEFAULT_OUTPUT_DIR;

  try {
    await fs.access(inputPath);
  } catch {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  await processExcel(inputPath, outputDir, {
    emitBookingsByChannel,
    asOfIso: asOfIso || isoFromLocalDate(new Date()),
  });
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
