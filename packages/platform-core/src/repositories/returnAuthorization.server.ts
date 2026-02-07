import "server-only";

import type { ReturnAuthorization } from "@acme/types";

import { prisma } from "../db";

import { resolveRepo } from "./repoResolver";

type ReturnAuthorizationRepo = {
  readReturnAuthorizations(): Promise<ReturnAuthorization[]>;
  writeReturnAuthorizations(data: ReturnAuthorization[]): Promise<void>;
  addReturnAuthorization(ra: ReturnAuthorization): Promise<void>;
  getReturnAuthorization(
    raId: string,
  ): Promise<ReturnAuthorization | undefined>;
};

let repoPromise: Promise<ReturnAuthorizationRepo> | undefined;

async function getRepo(): Promise<ReturnAuthorizationRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo<ReturnAuthorizationRepo>(
      () => (prisma as { returnAuthorization?: unknown }).returnAuthorization,
      () =>
        import("./returnAuthorization.prisma.server").then(
          (m) => m.prismaReturnAuthorizationRepository,
        ),
      () =>
        import("./returnAuthorization.json.server").then(
          (m) => m.jsonReturnAuthorizationRepository,
        ),
      { backendEnvVar: "RETURN_AUTH_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readReturnAuthorizations(): Promise<ReturnAuthorization[]> {
  const repo = await getRepo();
  return repo.readReturnAuthorizations();
}

export async function writeReturnAuthorizations(
  data: ReturnAuthorization[],
): Promise<void> {
  const repo = await getRepo();
  return repo.writeReturnAuthorizations(data);
}

export async function addReturnAuthorization(
  ra: ReturnAuthorization,
): Promise<void> {
  const repo = await getRepo();
  return repo.addReturnAuthorization(ra);
}

export async function getReturnAuthorization(
  raId: string,
): Promise<ReturnAuthorization | undefined> {
  const repo = await getRepo();
  return repo.getReturnAuthorization(raId);
}

