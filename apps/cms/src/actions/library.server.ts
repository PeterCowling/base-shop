// apps/cms/src/actions/library.server.ts
"use server";

import path from "path";
import type { PageComponent } from "@acme/types";
import { ensureAuthorized } from "./common/auth";
import { readJsonFile, writeJsonFile, withFileLock } from "@/lib/server/jsonIO";
import { validateTemplateCreation } from "@acme/platform-core/validation/templateValidation";
import { rootPlacementOptions } from "@acme/platform-core/validation/options";

export type LibraryItem = {
  id: string;
  label: string;
  createdAt: number;
  template?: PageComponent;
  templates?: PageComponent[];
  tags?: string[];
  thumbnail?: string | null;
  ownerUserId?: string;
  shared?: boolean;
};

function resolveFile(shop: string) {
  // Persist under repo-local data/cms/library/<shop>.json
  return path.resolve(process.cwd(), "data", "cms", "library", `${shop}.json`);
}

async function readAll(shop: string): Promise<LibraryItem[]> {
  const file = resolveFile(shop);
  return readJsonFile<LibraryItem[]>(file, []);
}

// writeAll helper not used currently; keep read/modify within withFileLock

export async function listLibrary(shop: string): Promise<LibraryItem[]> {
  const session = await ensureAuthorized();
  const userId = String(((session as { user?: { id?: string } }).user?.id) ?? "");
  const all = await readAll(shop);
  return all.filter((i) => i.shared || i.ownerUserId === userId);
}

export async function saveLibraryItem(shop: string, item: LibraryItem): Promise<void> {
  const session = await ensureAuthorized();
  const userId = String(((session as { user?: { id?: string } }).user?.id) ?? "");
  const value: LibraryItem = { ...item, ownerUserId: userId, shared: Boolean(item.shared) };

  const file = resolveFile(shop);
  await withFileLock(file, async () => {
    const current = await readJsonFile<LibraryItem[]>(file, []);
    const exists = current.some((i) => i.id === value.id);
    // Validate only on creation (new id)
    if (!exists) {
      const templates: PageComponent[] = value.templates ?? (value.template ? [value.template] : []);
      if (templates.length) {
        const result = validateTemplateCreation(templates, rootPlacementOptions());
        if (result.ok === false) {
          type ValidationError = Error & {
            code: "VALIDATION";
            issues: import("@acme/platform-core/validation/templateValidation").ValidationIssue[];
          };
          const err = new Error(
            `Component validation failed: ${result.errors.join("; ")}`,
          ) as ValidationError;
          err.code = "VALIDATION";
          err.issues = result.issues ?? [];
          throw err;
        }
      }
    }
    const next = [value, ...current.filter((i) => i.id !== value.id)];
    await writeJsonFile(file, next, 2);
  });
}

export async function updateLibraryItem(
  shop: string,
  id: string,
  patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail" | "shared">>,
): Promise<void> {
  const session = await ensureAuthorized();
  const userId = String(((session as { user?: { id?: string } }).user?.id) ?? "");
  const file = resolveFile(shop);
  await withFileLock(file, async () => {
    const current = await readJsonFile<LibraryItem[]>(file, []);
    const idx = current.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const item = current[idx];
    if (item.ownerUserId && item.ownerUserId !== userId) return; // not owner: ignore
    current[idx] = { ...item, ...patch } as LibraryItem;
    await writeJsonFile(file, current, 2);
  });
}

export async function removeLibraryItem(shop: string, id: string): Promise<void> {
  const session = await ensureAuthorized();
  const userId = String(((session as { user?: { id?: string } }).user?.id) ?? "");
  const file = resolveFile(shop);
  await withFileLock(file, async () => {
    const current = await readJsonFile<LibraryItem[]>(file, []);
    const next = current.filter((i) => !(i.id === id && (i.ownerUserId === userId)));
    await writeJsonFile(file, next, 2);
  });
}

export async function clearUserLibrary(shop: string): Promise<void> {
  const session = await ensureAuthorized();
  const userId = String(((session as { user?: { id?: string } }).user?.id) ?? "");
  const file = resolveFile(shop);
  await withFileLock(file, async () => {
    const current = await readJsonFile<LibraryItem[]>(file, []);
    const next = current.filter((i) => i.ownerUserId !== userId);
    await writeJsonFile(file, next, 2);
  });
}
