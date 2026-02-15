#!/usr/bin/env node

/**
 * Octorate bookings data processor.
 *
 * Processes Octorate reservations Excel export into monthly aggregates:
 * - Deduplicates by booking reference (Refer column)
 * - Aggregates by create time month
 * - Calculates channel attribution (Direct vs OTA)
 * - Outputs bookings_by_month.csv and net_value_by_month.csv
 *
 * Usage:
 *   node octorate-process-bookings.mjs /path/to/export.xls [output-dir]
 *
 * Prereqs:
 *   - pnpm install (exceljs must be available)
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ExcelJS from "exceljs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_OUTPUT_DIR = join(__dirname, "../../docs/business-os/strategy/BRIK/data");

function parseDate(value) {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    // Try parsing as ISO date or Excel date string
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
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
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function isDirectBooking(roomName) {
  // Direct bookings won't have "OTA" in the room name
  // Based on existing data, all OTA bookings have "OTA" prefix in room column
  if (typeof roomName !== "string") return false;
  return !roomName.toLowerCase().includes("ota");
}

async function processExcel(inputPath, outputDir) {
  console.info("Octorate Bookings Processor");
  console.info("==========================\n");
  console.info(`Input file: ${inputPath}`);
  console.info(`Output directory: ${outputDir}\n`);

  // Read Excel file
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(inputPath);
  const ws = wb.worksheets[0];

  console.info(`Loaded sheet: ${ws.name}`);
  console.info(`Total rows: ${ws.rowCount}\n`);

  // Parse all booking records
  const bookings = [];
  let skippedRows = 0;

  // Skip header row (row 1)
  for (let rowNum = 2; rowNum <= ws.rowCount; rowNum++) {
    const row = ws.getRow(rowNum);

    const createTime = parseDate(row.getCell(1).value);
    const refer = row.getCell(4).value;
    const room = row.getCell(7).value;
    const totalRoom = parseValue(row.getCell(8).value);

    if (!createTime || !refer) {
      skippedRows++;
      continue;
    }

    const yearMonth = formatYearMonth(createTime);
    if (!yearMonth) {
      skippedRows++;
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

  console.info(`Parsed ${bookings.length} booking records`);
  if (skippedRows > 0) {
    console.info(`Skipped ${skippedRows} rows (missing date or reference)\n`);
  } else {
    console.info("");
  }

  // Deduplicate by month + refer
  // Keep first occurrence (earliest row)
  const uniqueBookings = new Map();

  for (const booking of bookings) {
    const key = `${booking.yearMonth}|${booking.refer}`;

    if (!uniqueBookings.has(key)) {
      uniqueBookings.set(key, booking);
    }
  }

  const deduped = Array.from(uniqueBookings.values());
  const duplicatesRemoved = bookings.length - deduped.length;

  console.info(`After deduplication: ${deduped.length} unique bookings`);
  console.info(`Duplicates removed: ${duplicatesRemoved}\n`);

  // Aggregate by month
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

  // Calculate duplicates per month
  for (const booking of bookings) {
    if (monthlyData.has(booking.yearMonth)) {
      monthlyData.get(booking.yearMonth).rawRows += 1;
    }
  }

  for (const data of monthlyData.values()) {
    data.duplicatesRemoved = data.rawRows - data.bookingsCount;
  }

  // Sort by month
  const sortedMonths = Array.from(monthlyData.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  console.info(`Aggregated into ${sortedMonths.length} months`);
  console.info(`Date range: ${sortedMonths[0].month} to ${sortedMonths[sortedMonths.length - 1].month}\n`);

  // Generate bookings_by_month.csv
  const bookingsCsv = [
    "month,bookings_count,gross_booking_value,channel_source,notes",
  ];

  for (const data of sortedMonths) {
    const channelStr =
      data.directCount > 0 && data.otaCount > 0
        ? `Direct:${data.directCount}; OTA:${data.otaCount}`
        : data.directCount > 0
          ? `Direct:${data.directCount}`
          : `OTA:${data.otaCount}`;

    const notes = `observed from ${inputPath.split("/").pop()}; raw_rows=${data.rawRows}; duplicate_refs_removed=${data.duplicatesRemoved}`;

    bookingsCsv.push(
      `${data.month},${data.bookingsCount},${data.grossValue.toFixed(2)},${channelStr},${notes}`
    );
  }

  // Generate net_value_by_month.csv
  const netValueCsv = ["month,net_booking_value,method,notes"];

  for (const data of sortedMonths) {
    const method = "observed export marked net-of-cancellations; deduped by Refer per month";
    const notes = `observed from ${inputPath.split("/").pop()}; raw_rows=${data.rawRows}; duplicate_refs_removed=${data.duplicatesRemoved}`;

    netValueCsv.push(
      `${data.month},${data.grossValue.toFixed(2)},${method},${notes}`
    );
  }

  // Write output files
  await fs.mkdir(outputDir, { recursive: true });

  const bookingsPath = join(outputDir, "bookings_by_month.csv");
  const netValuePath = join(outputDir, "net_value_by_month.csv");

  await fs.writeFile(bookingsPath, bookingsCsv.join("\n") + "\n", "utf-8");
  await fs.writeFile(netValuePath, netValueCsv.join("\n") + "\n", "utf-8");

  console.info("Output files written:");
  console.info(`  ${bookingsPath}`);
  console.info(`  ${netValuePath}\n`);

  // Summary stats
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
    console.error("Usage: node octorate-process-bookings.mjs <input-file.xls> [output-dir]");
    console.error("");
    console.error("Example:");
    console.error("  node octorate-process-bookings.mjs /Users/pete/Downloads/export_19519177.xls");
    console.error("  node octorate-process-bookings.mjs ./export.xls ./output");
    process.exit(1);
  }

  const inputPath = args[0];
  const outputDir = args[1] || DEFAULT_OUTPUT_DIR;

  try {
    await fs.access(inputPath);
  } catch {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  await processExcel(inputPath, outputDir);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
