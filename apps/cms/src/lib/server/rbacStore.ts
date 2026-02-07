import "server-only";

import * as fsSync from "fs";
import { promises as fs } from "fs";
import * as path from "path";

import type { Permission } from "@acme/auth";
import { ROLE_PERMISSIONS } from "@acme/auth/permissions";
// apps/cms/src/lib/server/rbacStore.ts
import type { CmsUser } from "@acme/types";

import { writeJsonFile } from "@/lib/server/jsonIO";

import type { Role } from "../../auth/roles";

export interface RbacDB {
  users: Record<string, CmsUser>;
  roles: Record<string, Role | Role[]>;
  permissions: Record<Role, Permission[]>;
}

const DEFAULT_DB: RbacDB = {
  users: {
    "1": {
      id: "1",
      name: "Admin", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      email: "admin@example.com", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      password: "admin", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
    },
    "2": {
      id: "2",
      name: "Viewer", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      email: "viewer@example.com", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      password: "$2b$10$zrw7b.7IguK2cWtM83jgKOKe0YiM6BTzGI.S60J1nlanjPw7G5dt6", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
    },
    "3": {
      id: "3",
      name: "Shop Admin", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      email: "shopadmin@example.com", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      password: "$2b$10$iiBPVdzX6hr0R.9eOSN36uhBqt0iOIj6ecZlPA.NBpzswomxcTvfi", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
    },
    "4": {
      id: "4",
      name: "Catalog Manager", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      email: "catalogmanager@example.com", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      password: "$2b$10$bXz7QTWvPrn7okbbk58uDOJKBPJfPU6RI8F5HV4M5DnBFwSIbXi/y", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
    },
    "5": {
      id: "5",
      name: "Theme Editor", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      email: "themeeditor@example.com", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
      password: "$2b$10$XCLdGULFzVh56kw/oRP2husM07I1fPe0NqjIUxk9d2/PZBTwVIruK", // i18n-exempt -- seed user fixture; not user-facing; CMS-1010
    },
  },
  roles: {
    "1": "admin",
    "2": "viewer",
    "3": "ShopAdmin",
    "4": "CatalogManager",
    "5": "ThemeEditor",
  },
  permissions: { ...ROLE_PERMISSIONS },
};

function resolveFile(): string {
  let dir = process.cwd();
  while (true) {
    const candidateDir = path.join(dir, "data", "cms");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-1010
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-1010
    const buf = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(buf) as RbacDB;
    if (parsed && parsed.users && parsed.roles && parsed.permissions) {
      const permissions: Record<Role, Permission[]> = {
        ...DEFAULT_DB.permissions,
      };
      for (const role of Object.keys(parsed.permissions) as Role[]) {
        permissions[role] = Array.from(
          new Set([...(permissions[role] ?? []), ...parsed.permissions[role]])
        );
      }
      return { ...DEFAULT_DB, ...parsed, permissions };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_DB };
}

export async function writeRbac(
  db: RbacDB | null | undefined
): Promise<void> {
  if (db == null) {
    throw new TypeError("db must be defined"); // i18n-exempt -- developer error, not user-facing; CMS-1010
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-1010
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${Date.now()}.tmp`;
  await writeJsonFile(tmp, db);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-1010
    await fs.rename(tmp, FILE);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}
