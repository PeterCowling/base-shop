import { authOptions } from "@cms/auth/options";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import Wizard from "./Wizard.oldtsx";

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

async function listThemes(): Promise<string[]> {
  const dir = path.join(resolvePackagesRoot(), "themes");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function listTemplates(): Promise<string[]> {
  const dir = resolvePackagesRoot();
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith("template"))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export default async function WizardPage() {
  const [session, themes, templates] = await Promise.all([
    getServerSession(authOptions),
    listThemes(),
    listTemplates(),
  ]);

  if (!session || session.user.role !== "admin") {
    redirect("/cms");
  }
  const disabled = themes.length === 0 || templates.length === 0;

  return (
    <>
      {disabled && <p>No themes available</p>}
      <Wizard themes={themes} templates={templates} disabled={disabled} />
    </>
  );
}
