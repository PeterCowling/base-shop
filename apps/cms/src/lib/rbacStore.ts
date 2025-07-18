// apps/cms/src/lib/rbacStore.ts

import type { CmsUser } from "@types";
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { Role } from "../auth/roles";

export interface RbacDB {
  users: Record<string, CmsUser>;
  roles: Record<string, Role | Role[]>;
}

const DEFAULT_DB: RbacDB = {
  users: {
    "1": {
      id: "1",
      name: "Admin",
      email: "admin@example.com",
      password: "admin",
    },
    "2": {
      id: "2",
      name: "Viewer",
      email: "viewer@example.com",
      password: "$2b$10$zrw7b.7IguK2cWtM83jgKOKe0YiM6BTzGI.S60J1nlanjPw7G5dt6",
    },
    "3": {
      id: "3",
      name: "Shop Admin",
      email: "shopadmin@example.com",
      password: "$2b$10$iiBPVdzX6hr0R.9eOSN36uhBqt0iOIj6ecZlPA.NBpzswomxcTvfi",
    },
    "4": {
      id: "4",
      name: "Catalog Manager",
      email: "catalogmanager@example.com",
      password: "$2b$10$bXz7QTWvPrn7okbbk58uDOJKBPJfPU6RI8F5HV4M5DnBFwSIbXi/y",
    },
    "5": {
      id: "5",
      name: "Theme Editor",
      email: "themeeditor@example.com",
      password: "$2b$10$XCLdGULFzVh56kw/oRP2husM07I1fPe0NqjIUxk9d2/PZBTwVIruK",
    },
  },
  roles: {
    "1": "admin",
    "2": "viewer",
    "3": "ShopAdmin",
    "4": "CatalogManager",
    "5": "ThemeEditor",
  },
};

function resolveFile(): string {
  let dir = process.cwd();
  while (true) {
    const candidateDir = path.join(dir, "data", "cms");
    if (fsSync.existsSync(candidateDir)) {
      return path.join(candidateDir, "users.json");
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "cms", "users.json");
}

const FILE = resolveFile();

export async function readRbac(): Promise<RbacDB> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(buf) as RbacDB;
    if (parsed && parsed.users && parsed.roles) return parsed;
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_DB };
}

export async function writeRbac(db: RbacDB): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}
