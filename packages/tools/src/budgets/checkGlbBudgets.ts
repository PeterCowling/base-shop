import { NodeIO, Primitive } from "@gltf-transform/core";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { estimateTextureMemoryMB } from "./estimateTextureMemory";

type BudgetTier = {
  maxTriangles: number;
  maxMaterials: number;
  maxTextures: number;
  maxDecodedTextureMemoryMB: number;
};

type BudgetsFile = {
  version?: string;
  mobile?: BudgetTier;
  desktop?: BudgetTier;
};

type TierName = "mobile" | "desktop";

export type BudgetCheckResult = {
  productId: string;
  tier: TierName;
  ok: boolean;
  messages: string[];
};

const PRODUCT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/i;

function triangleCountForPrimitive(primitive: Primitive) {
  const mode = primitive.getMode();
  const indices = primitive.getIndices();
  const position = primitive.getAttribute("POSITION");
  const count = indices?.getCount() ?? position?.getCount() ?? 0;
  if (mode === Primitive.Mode.TRIANGLES) return Math.floor(count / 3);
  if (mode === Primitive.Mode.TRIANGLE_STRIP) return Math.max(0, count - 2);
  if (mode === Primitive.Mode.TRIANGLE_FAN) return Math.max(0, count - 2);
  return 0;
}

async function readGlbStats(filePath: string) {
  const io = new NodeIO();
  const doc = await io.read(filePath);
  const root = doc.getRoot();

  let triangles = 0;
  for (const mesh of root.listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      triangles += triangleCountForPrimitive(primitive);
    }
  }

  return {
    triangles,
    materials: root.listMaterials().length,
    textures: root.listTextures().length,
    decodedTextureMemoryMB: estimateTextureMemoryMB(doc),
  };
}

function compareBudget(stats: Awaited<ReturnType<typeof readGlbStats>>, budget: BudgetTier) {
  const failures: string[] = [];
  if (stats.triangles > budget.maxTriangles) {
    failures.push(`triangles ${stats.triangles} > ${budget.maxTriangles}`);
  }
  if (stats.materials > budget.maxMaterials) {
    failures.push(`materials ${stats.materials} > ${budget.maxMaterials}`);
  }
  if (stats.textures > budget.maxTextures) {
    failures.push(`textures ${stats.textures} > ${budget.maxTextures}`);
  }
  if (stats.decodedTextureMemoryMB > budget.maxDecodedTextureMemoryMB) {
    failures.push(
      `texture memory ${stats.decodedTextureMemoryMB.toFixed(1)}MB > ${budget.maxDecodedTextureMemoryMB}MB`,
    );
  }
  return failures;
}

export async function checkGlbBudgets({
  repoRoot,
  productId,
  tier,
  strictMissing = false,
}: {
  repoRoot: string;
  productId?: string;
  tier?: TierName;
  strictMissing?: boolean;
}): Promise<BudgetCheckResult[]> {
  const productsDir = path.join(repoRoot, "products");
  const productIds =
    typeof productId === "string"
      ? [productId]
      : // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 repoRoot is a trusted workspace path
        (await readdir(productsDir, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);

  const safeProductIds = productIds.filter((id) => PRODUCT_ID_PATTERN.test(id));

  const tiers: TierName[] = tier ? [tier] : ["mobile", "desktop"];
  const results: BudgetCheckResult[] = [];

  for (const id of safeProductIds) {
    const budgetsPath = path.join(productsDir, id, "budgets.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 path is built from validated product id
    if (!existsSync(budgetsPath)) continue;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 path is built from validated product id
    const budgets = JSON.parse(await readFile(budgetsPath, "utf8")) as BudgetsFile;

    for (const currentTier of tiers) {
      const budget = budgets[currentTier];
      if (!budget) continue;
      const tierFilename = currentTier === "mobile" ? "mobile" : "desktop";
      const gltfPath = path.join(productsDir, id, "assets", "v1", `${tierFilename}.gltf`);
      const glbPath = path.join(productsDir, id, "assets", `${tierFilename}.glb`);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 path is built from validated product id
      const assetPath = existsSync(gltfPath) ? gltfPath : glbPath;

      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 path is built from validated product id
      if (!existsSync(assetPath)) {
        results.push({
          productId: id,
          tier: currentTier,
          ok: !strictMissing,
          messages: [
            `missing asset: ${path.relative(repoRoot, assetPath)}`,
          ],
        });
        continue;
      }

      const stats = await readGlbStats(assetPath);
      const failures = compareBudget(stats, budget);
      results.push({
        productId: id,
        tier: currentTier,
        ok: failures.length === 0,
        messages: failures.length
          ? failures
          : [
              `triangles ${stats.triangles}`,
              `materials ${stats.materials}`,
              `textures ${stats.textures}`,
              `texture memory ${stats.decodedTextureMemoryMB.toFixed(1)}MB`,
            ],
      });
    }
  }

  return results;
}
