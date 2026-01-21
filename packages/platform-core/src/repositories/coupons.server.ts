import "server-only";

import type { Coupon } from "@acme/types";

import { prisma } from "../db";

import type { CouponsRepository } from "./coupons.json.server";
import { resolveRepo } from "./repoResolver";

let repoPromise: Promise<CouponsRepository> | undefined;

async function getRepo(): Promise<CouponsRepository> {
  if (!repoPromise) {
    repoPromise = resolveRepo<CouponsRepository>(
      () => (prisma as { coupon?: unknown }).coupon,
      () =>
        import("./coupons.prisma.server").then(
          (m) => m.prismaCouponsRepository,
        ),
      () =>
        import("./coupons.json.server").then(
          (m) => m.jsonCouponsRepository,
        ),
      { backendEnvVar: "COUPONS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readCouponRepo(shop: string): Promise<Coupon[]> {
  const repo = await getRepo();
  return repo.read(shop);
}

export async function writeCouponRepo(
  shop: string,
  coupons: Coupon[],
): Promise<void> {
  const repo = await getRepo();
  return repo.write(shop, coupons);
}

export async function getCouponByCode(
  shop: string,
  code: string,
): Promise<Coupon | null> {
  const repo = await getRepo();
  return repo.getByCode(shop, code);
}

export type { CouponsRepository };

