import { cpSync, existsSync, mkdirSync, readdirSync, unlinkSync, renameSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
const args = process.argv.slice(2);
const rollback = args.includes("--rollback");
const slug = args.find((a) => !a.startsWith("--"));
if (!slug) {
    console.error("Usage: pnpm ts-node scripts/src/upgrade-shop.ts <shop-slug> [--rollback]");
    process.exit(1);
}
const shopId = slug.startsWith("shop-") ? slug : `shop-${slug}`;
const rootDir = path.resolve(__dirname, "..", "..");
const appDir = path.join(rootDir, "apps", shopId);
const templateDir = path.join(rootDir, "packages", "template-app");
const shopJsonPath = path.join(rootDir, "data", "shops", shopId, "shop.json");
if (!existsSync(appDir)) {
    console.error(`Shop app does not exist: ${appDir}`);
    process.exit(1);
}
if (rollback) {
    restoreBackups(appDir);
    restoreBackups(path.dirname(shopJsonPath));
    if (existsSync(shopJsonPath)) {
        const data = JSON.parse(readFileSync(shopJsonPath, "utf8"));
        delete data.lastUpgrade;
        delete data.componentVersions;
        writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
    }
    console.log(`Rollback completed for ${shopId}`);
    process.exit(0);
}
copyTemplate(templateDir, appDir);
if (existsSync(shopJsonPath)) {
    cpSync(shopJsonPath, shopJsonPath + ".bak");
    const data = JSON.parse(readFileSync(shopJsonPath, "utf8"));
    data.lastUpgrade = new Date().toISOString();
    const pkgPath = path.join(appDir, "package.json");
    data.componentVersions = existsSync(pkgPath)
        ? JSON.parse(readFileSync(pkgPath, "utf8")).dependencies ?? {}
        : {};
    writeFileSync(shopJsonPath, JSON.stringify(data, null, 2));
}
const envPath = path.join(appDir, ".env");
if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf8");
    if (!envContent.includes("UPGRADE_PREVIEW_TOKEN_SECRET=")) {
        const upgradeToken = randomBytes(32).toString("hex");
        writeFileSync(envPath, envContent + `\nUPGRADE_PREVIEW_TOKEN_SECRET=${upgradeToken}\n`);
    }
}
console.log(`Upgrade staged for ${shopId}. Backups saved with .bak extension. Use --rollback to undo.`);
function copyTemplate(srcDir, destDir) {
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        if (["node_modules", "dist", ".next"].includes(entry.name))
            continue;
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            mkdirSync(destPath, { recursive: true });
            copyTemplate(srcPath, destPath);
        }
        else {
            if (existsSync(destPath)) {
                cpSync(destPath, destPath + ".bak");
            }
            cpSync(srcPath, destPath);
        }
    }
}
function restoreBackups(dir) {
    if (!existsSync(dir))
        return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            restoreBackups(full);
            continue;
        }
        if (!entry.name.endsWith(".bak"))
            continue;
        const original = full.slice(0, -4);
        if (existsSync(original))
            unlinkSync(original);
        renameSync(full, original);
    }
}
