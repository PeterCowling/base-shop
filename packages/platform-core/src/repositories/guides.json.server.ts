import "server-only";

import { promises as fs } from "fs";
import * as path from "path";
import { ulid } from "ulid";

import { nowIso } from "@acme/date-utils";
import {
  type GuideContentInput,
  guideContentSchema,
  type GuidePublication,
} from "@acme/types";

import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops/index";

import type { GuidesRepository } from "./guides.types";

function filePath(shop: string): string {
  return path.join(DATA_ROOT, validateShopName(shop), "guides.json");
}

function contentFilePath(shop: string, key: string, locale: string): string {
  return path.join(
    DATA_ROOT,
    validateShopName(shop),
    "guides",
    "content",
    key,
    `${locale}.json`,
  );
}

async function ensureMetadataDir(shop: string): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe path built from DATA_ROOT + validated shop
  await fs.mkdir(path.join(DATA_ROOT, validateShopName(shop)), {
    recursive: true,
  });
}

async function ensureContentDir(
  shop: string,
  key: string,
  locale: string,
): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe path built from DATA_ROOT + validated shop
  await fs.mkdir(path.dirname(contentFilePath(shop, key, locale)), {
    recursive: true,
  });
}

async function writeAtomic(targetPath: string, payload: unknown): Promise<void> {
  const tmp = `${targetPath}.${Date.now()}.tmp`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe path built from DATA_ROOT + validated shop
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe path built from DATA_ROOT + validated shop
  await fs.rename(tmp, targetPath);
}

async function read<T = GuidePublication>(shop: string): Promise<T[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe path built from DATA_ROOT + validated shop
    const file = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(file) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [] as T[];
    }
    throw error;
  }
}

async function write<T = GuidePublication>(
  shop: string,
  guides: T[],
): Promise<void> {
  await ensureMetadataDir(shop);
  await writeAtomic(filePath(shop), guides);
}

async function getById<T extends { id: string } = GuidePublication>(
  shop: string,
  id: string,
): Promise<T | null> {
  const guides = await read<T>(shop);
  return guides.find((guide) => guide.id === id) ?? null;
}

async function getByKey(
  shop: string,
  key: string,
): Promise<GuidePublication | null> {
  const guides = await read<GuidePublication>(shop);
  return guides.find((guide) => guide.key === key) ?? null;
}

async function update<
  T extends { id: string; row_version: number } = GuidePublication,
>(shop: string, patch: Partial<T> & { id: string }): Promise<T> {
  const guides = await read<T>(shop);
  const index = guides.findIndex((guide) => guide.id === patch.id);
  if (index === -1) {
    throw new Error(`Guide ${patch.id} not found in ${shop}`);
  }

  const updated: T = {
    ...guides[index],
    ...patch,
    row_version: guides[index].row_version + 1,
  };

  guides[index] = updated;
  await write(shop, guides);
  return updated;
}

async function remove(shop: string, id: string): Promise<void> {
  const guides = await read<GuidePublication>(shop);
  const next = guides.filter((guide) => guide.id !== id);
  if (next.length === guides.length) {
    throw new Error(`Guide ${id} not found in ${shop}`);
  }
  await write(shop, next);
}

async function duplicate<T extends GuidePublication = GuidePublication>(
  shop: string,
  id: string,
): Promise<T> {
  const guides = await read<T>(shop);
  const original = guides.find((guide) => guide.id === id);
  if (!original) {
    throw new Error(`Guide ${id} not found in ${shop}`);
  }

  const now = nowIso();
  const copy: T = {
    ...original,
    id: ulid(),
    status: "draft",
    row_version: 1,
    created_at: now,
    updated_at: now,
  };

  await write(shop, [copy, ...guides]);
  return copy;
}

async function getContent(
  shop: string,
  key: string,
  locale: string,
): Promise<GuideContentInput | null> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Safe path built from DATA_ROOT + validated shop
    const file = await fs.readFile(contentFilePath(shop, key, locale), "utf8");
    return JSON.parse(file) as GuideContentInput;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeContent(
  shop: string,
  key: string,
  locale: string,
  content: GuideContentInput,
): Promise<void> {
  await ensureContentDir(shop, key, locale);
  const parsed = guideContentSchema.parse(content);
  await writeAtomic(contentFilePath(shop, key, locale), {
    ...parsed,
    lastUpdated: nowIso(),
  });
}

export const jsonGuidesRepository: GuidesRepository = {
  read,
  write,
  getById,
  getByKey,
  update,
  delete: remove,
  duplicate,
  getContent,
  writeContent,
};
