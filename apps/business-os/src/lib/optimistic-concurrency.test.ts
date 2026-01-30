import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { computeFileSha } from "./file-sha";
import { checkCardBaseFileSha } from "./optimistic-concurrency";
import { mkdirWithinRoot, writeFileWithinRoot } from "./safe-fs";

describe("optimistic-concurrency", () => {
  let tempDir: string;
  let businessOsPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "business-os-occ-"));
    businessOsPath = path.join(tempDir, "docs/business-os");

    await mkdirWithinRoot(tempDir, path.join(businessOsPath, "cards"), {
      recursive: true,
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns ok when baseFileSha is not provided", async () => {
    const result = await checkCardBaseFileSha({
      repoRoot: tempDir,
      cardId: "BRIK-OPP-0001",
      baseFileSha: undefined,
    });

    expect(result).toEqual({ ok: true });
  });

  it("returns ok when baseFileSha matches current file sha", async () => {
    const cardId = "BRIK-OPP-0001";
    const filePath = path.join(businessOsPath, `cards/${cardId}.user.md`);

    const raw = `---
Type: Card
Lane: Inbox
Priority: P2
Owner: Pete
ID: ${cardId}
---

# Title

Body
`;
    await writeFileWithinRoot(tempDir, filePath, raw);

    const baseFileSha = computeFileSha(raw);

    const result = await checkCardBaseFileSha({
      repoRoot: tempDir,
      cardId,
      baseFileSha,
    });

    expect(result).toEqual({ ok: true });
  });

  it("returns conflict when baseFileSha does not match current file sha", async () => {
    const cardId = "BRIK-OPP-0001";
    const filePath = path.join(businessOsPath, `cards/${cardId}.user.md`);

    const rawV1 = `---
Type: Card
Lane: Inbox
Priority: P2
Owner: Pete
ID: ${cardId}
---

# Title

Body v1
`;
    await writeFileWithinRoot(tempDir, filePath, rawV1);

    const baseFileSha = computeFileSha(rawV1);

    const rawV2 = rawV1.replace("Body v1", "Body v2");
    await writeFileWithinRoot(tempDir, filePath, rawV2);

    const currentFileSha = computeFileSha(rawV2);

    const result = await checkCardBaseFileSha({
      repoRoot: tempDir,
      cardId,
      baseFileSha,
    });

    expect(result).toEqual({
      ok: false,
      reason: "baseFileShaMismatch",
      currentFileSha,
    });
  });
});

