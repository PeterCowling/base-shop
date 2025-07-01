import { authOptions } from "@cms/auth/options";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import Wizard from "./Wizard";

export const metadata: Metadata = {
  title: "Create Shop · Base-Shop",
};

async function listThemes(): Promise<string[]> {
  const dir = path.join(process.cwd(), "packages", "themes");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function listTemplates(): Promise<string[]> {
  const dir = path.join(process.cwd(), "packages");
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

  return <Wizard themes={themes} templates={templates} />;
}
