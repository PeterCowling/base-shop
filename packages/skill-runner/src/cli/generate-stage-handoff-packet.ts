#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  generateStageHandoffPacket,
  resolveStageHandoffPacketPath,
  serializeStageHandoffPacket,
} from "../generate-stage-handoff-packet.js";

function main(): void {
  const { artifactPath, outputPath } = parseArgs(process.argv.slice(2));
  if (!artifactPath) {
    console.error(
      "Usage: generate-stage-handoff-packet <artifact.md> [--output <artifact.packet.json>]",
    );
    process.exit(2);
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI path is operator-provided local file input [ttl=2026-12-31]
  const markdown = readFileSync(artifactPath, "utf8");
  const packet = generateStageHandoffPacket(artifactPath, markdown);
  const finalOutputPath = outputPath ?? resolveStageHandoffPacketPath(artifactPath);
  const serialized = serializeStageHandoffPacket(packet);

  mkdirSync(path.dirname(finalOutputPath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SKILL-2401 CLI output path is operator-provided local repo path [ttl=2026-12-31]
  writeFileSync(finalOutputPath, serialized, "utf8");

  process.stdout.write(
    `${JSON.stringify(
      {
        stage: packet.stage,
        feature_slug: packet.feature_slug,
        artifact_path: artifactPath,
        output_path: finalOutputPath,
      },
      null,
      2,
    )}\n`,
  );
}

function parseArgs(argv: string[]): {
  artifactPath: string | null;
  outputPath: string | null;
} {
  let artifactPath: string | null = null;
  let outputPath: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") {
      outputPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (!artifactPath) {
      artifactPath = arg;
    }
  }

  return { artifactPath, outputPath };
}

main();
