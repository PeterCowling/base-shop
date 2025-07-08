// apps/cms/src/app/cms/wizard/page.tsx

import { authOptions } from "@cms/auth/options";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import Wizard from "./Wizard";

export const metadata: Metadata = {
  title: "Create Shop · Base-Shop",
};

function resolvePackagesRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "packages");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "packages");
}

interface ListResult {
  items: string[];
  error?: string;
}

async function listThemes(): Promise<ListResult> {
  const dir = path.join(resolvePackagesRoot(), "themes");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return { items: entries.filter((e) => e.isDirectory()).map((e) => e.name) };
  } catch (err) {
    console.error("[wizard] failed to read themes directory", err);
    return { items: [], error: (err as Error).message };
  }
}

async function listTemplates(): Promise<ListResult> {
  const dir = resolvePackagesRoot();
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return {
      items: entries
        .filter((e) => e.isDirectory() && e.name.startsWith("template"))
        .map((e) => e.name),
    };
  } catch (err) {
    console.error("[wizard] failed to read templates directory", err);
    return { items: [], error: (err as Error).message };
  }
}

export default async function WizardPage() {
  const [session, themeRes, templateRes] = await Promise.all([
    getServerSession(authOptions),
    listThemes(),
    listTemplates(),
  ]);
  const themes = themeRes.items;
  const templates = templateRes.items;

  if (!session || session.user.role !== "admin") {
    redirect("/cms");
  }
  const disabled =
    (themes?.length ?? 0) === 0 || (templates?.length ?? 0) === 0;

  return (
    <>
      {themeRes.error && (
        <p className="text-red-600">Error loading themes: {themeRes.error}</p>
      )}
      {templateRes.error && (
        <p className="text-red-600">
          Error loading templates: {templateRes.error}
        </p>
      )}
      {disabled && !(themeRes.error || templateRes.error) && (
        <p>No themes available</p>
      )}{" "}
      <Wizard themes={themes} templates={templates} disabled={disabled} />
    </>
  );
}
