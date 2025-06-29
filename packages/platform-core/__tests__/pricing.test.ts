import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withPricing(
  cb: (mod: typeof import("../pricing")) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pricing-"));
  await fs.mkdir(path.join(dir, "data", "shops", "dummy"), { recursive: true });
  await fs.mkdir(path.join(dir, "data", "rental"), { recursive: true });

  const matrix = {
    baseDailyRate: 50,
    durationDiscounts: [
      { minDays: 7, rate: 0.9 },
      { minDays: 30, rate: 0.75 },
    ],
    damageFees: { scratch: 10, lost: "deposit" },
  };
  await fs.writeFile(
    path.join(dir, "data", "rental", "pricing.json"),
    JSON.stringify(matrix),
    "utf8"
  );

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  const mod = require("../pricing");
  try {
    await cb(mod);
  } finally {
    process.chdir(cwd);
  }
}

describe("pricing utilities", () => {
  it("applyDurationDiscount chooses correct rate", () => {
    const { applyDurationDiscount } = require("../pricing");
    const discounts = [
      { minDays: 30, rate: 0.75 },
      { minDays: 7, rate: 0.9 },
    ];
    expect(applyDurationDiscount(100, 5, discounts)).toBe(100);
    expect(applyDurationDiscount(100, 10, discounts)).toBe(90);
    expect(applyDurationDiscount(100, 35, discounts)).toBe(75);
  });

  it("priceForDays uses sku fields and pricing matrix", async () => {
    await withPricing(async ({ priceForDays }) => {
      const sku1 = { dailyRate: 20 } as any;
      await expect(priceForDays(sku1, 5)).resolves.toBe(100);

      const sku2 = { price: 100 } as any;
      await expect(priceForDays(sku2, 8)).resolves.toBe(90 * 8);

      const sku3 = {} as any;
      await expect(priceForDays(sku3, 2)).resolves.toBe(50 * 2);
    });
  });

  it("computeDamageFee respects rules", async () => {
    await withPricing(async ({ computeDamageFee }) => {
      await expect(computeDamageFee("scratch", 200)).resolves.toBe(10);
      await expect(computeDamageFee("lost", 200)).resolves.toBe(200);
      await expect(computeDamageFee(30, 200)).resolves.toBe(30);
      await expect(computeDamageFee("missing", 200)).resolves.toBe(0);
      await expect(computeDamageFee(undefined, 200)).resolves.toBe(0);
    });
  });
});
