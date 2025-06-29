import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { applyDurationDiscount } from "../pricing";

async function withPricingRepo(
  pricing: any,
  cb: (mod: typeof import("../pricing")) => Promise<void>
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pricing-"));
  const rentalDir = path.join(dir, "data", "rental");
  await fs.mkdir(rentalDir, { recursive: true });
  await fs.writeFile(
    path.join(rentalDir, "pricing.json"),
    JSON.stringify(pricing, null, 2),
    "utf8"
  );

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const mod = await import("../pricing");
  try {
    await cb(mod);
  } finally {
    process.chdir(cwd);
  }
}

describe("pricing helpers", () => {
  it("applyDurationDiscount handles thresholds", () => {
    const discounts = [
      { minDays: 7, rate: 0.9 },
      { minDays: 30, rate: 0.8 },
    ];

    expect(applyDurationDiscount(100, 5, discounts)).toBe(100);
    expect(applyDurationDiscount(100, 7, discounts)).toBe(90);
    expect(applyDurationDiscount(100, 30, discounts)).toBe(80);
    expect(applyDurationDiscount(100, 31, discounts)).toBe(80);
  });

  it("priceForDays uses SKU and discounts", async () => {
    const pricing = {
      baseDailyRate: 50,
      durationDiscounts: [{ minDays: 7, rate: 0.9 }],
      damageFees: { scratch: 10, lost: "deposit" },
    };

    await withPricingRepo(pricing, async ({ priceForDays }) => {
      const sku = { price: 100 } as any;
      const total = await priceForDays(sku, 5);
      expect(total).toBe(500);

      const totalDiscount = await priceForDays(sku, 7);
      expect(totalDiscount).toBe(630);
    });
  });

  it("computeDamageFee resolves rules and defaults", async () => {
    const pricing = {
      baseDailyRate: 50,
      durationDiscounts: [],
      damageFees: { scratch: 10, lost: "deposit" },
    };

    await withPricingRepo(pricing, async ({ computeDamageFee }) => {
      await expect(computeDamageFee(undefined, 100)).resolves.toBe(0);
      await expect(computeDamageFee("scratch", 100)).resolves.toBe(10);
      await expect(computeDamageFee("lost", 25)).resolves.toBe(25);
      await expect(computeDamageFee(5, 20)).resolves.toBe(5);
      await expect(computeDamageFee("missing", 20)).resolves.toBe(0);
    });
  });
});
