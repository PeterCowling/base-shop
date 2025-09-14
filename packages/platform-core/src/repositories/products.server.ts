import "server-only";

import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";
import type { ProductPublication } from "../products/index";
import type { ProductsRepository } from "./products.types";

let repoPromise: Promise<ProductsRepository> | undefined;

async function getRepo(): Promise<ProductsRepository> {
  if (!repoPromise) {
    repoPromise = resolveRepo(
      () => prisma.product,
      () =>
        import("./products.prisma.server").then(
          (m) => m.prismaProductsRepository,
        ),
      () =>
        import("./products.json.server").then(
          (m) => m.jsonProductsRepository,
        ),
      { backendEnvVar: "PRODUCTS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readRepo<T = ProductPublication>(
  shop: string,
): Promise<T[]> {
  const repo = await getRepo();
  return repo.read(shop);
}

export async function writeRepo<T = ProductPublication>(
  shop: string,
  catalogue: T[],
): Promise<void> {
  const repo = await getRepo();
  return repo.write(shop, catalogue);
}

export async function getProductById<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<T | null> {
  const repo = await getRepo();
  return repo.getById(shop, id);
}

export async function updateProductInRepo<
  T extends { id: string; row_version: number } = ProductPublication,
>(shop: string, patch: Partial<T> & { id: string }): Promise<T> {
  const repo = await getRepo();
  return repo.update(shop, patch);
}

export async function deleteProductFromRepo(
  shop: string,
  id: string,
): Promise<void> {
  const repo = await getRepo();
  return repo.delete(shop, id);
}

export async function duplicateProductInRepo<
  T extends ProductPublication = ProductPublication,
>(shop: string, id: string): Promise<T> {
  const repo = await getRepo();
  return repo.duplicate(shop, id);
}
