"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.republishShop = republishShop;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_child_process_1 = require("node:child_process");

var SHOP_ID_REGEX = /^[a-z0-9_-]+$/;
function readUpgradeMeta(root, id) {
    var file = (0, node_path_1.join)(root, "data", "shops", id, "upgrade.json");
    return JSON.parse((0, node_fs_1.readFileSync)(file, "utf8"));
}
function run(cmd, args) {
    var res = (0, node_child_process_1.spawnSync)(cmd, args, { stdio: "inherit" });
    if (res.status !== 0) {
        throw new Error("".concat(cmd, " ").concat(args.join(" "), " failed with status ").concat(res.status));
    }
}
function updateStatus(root, id) {
    var _a;
    var file = (0, node_path_1.join)(root, "data", "shops", id, "shop.json");
    var json = JSON.parse((0, node_fs_1.readFileSync)(file, "utf8"));
    json.status = "published";
    var pkgPath = (0, node_path_1.join)(root, "apps", id, "package.json");
    json.componentVersions = (0, node_fs_1.existsSync)(pkgPath)
        ? (_a = JSON.parse((0, node_fs_1.readFileSync)(pkgPath, "utf8")).dependencies) !== null && _a !== void 0 ? _a : {}
        : {};
    (0, node_fs_1.writeFileSync)(file, JSON.stringify(json, null, 2));
}
function removeBakFiles(dir) {
    if (!(0, node_fs_1.existsSync)(dir))
        return;
    for (var _i = 0, _a = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true }); _i < _a.length; _i++) {
        var entry = _a[_i];
        var filePath = (0, node_path_1.join)(dir, entry.name);
        if (entry.isDirectory()) {
            removeBakFiles(filePath);
        }
        else if (entry.isFile() && filePath.endsWith(".bak")) {
            (0, node_fs_1.unlinkSync)(filePath);
        }
    }
}
function saveHistory(root, id) {
    var _a;
    var dir = (0, node_path_1.join)(root, "data", "shops", id);
    var shopFile = (0, node_path_1.join)(dir, "shop.json");
    var historyFile = (0, node_path_1.join)(dir, "history.json");
    if (!(0, node_fs_1.existsSync)(shopFile))
        return;
    var current = JSON.parse((0, node_fs_1.readFileSync)(shopFile, "utf8"));
    var entry = {
        componentVersions: (_a = current.componentVersions) !== null && _a !== void 0 ? _a : {},
        lastUpgrade: current.lastUpgrade,
        timestamp: new Date().toISOString(),
    };
    var history = (0, node_fs_1.existsSync)(historyFile)
        ? JSON.parse((0, node_fs_1.readFileSync)(historyFile, "utf8"))
        : [];
    history.push(entry);
    (0, node_fs_1.writeFileSync)(historyFile, JSON.stringify(history, null, 2));
}
function auditRepublish(root, id) {
    try {
        var file = (0, node_path_1.join)(root, "data", "shops", id, "audit.log");
        var entry = { action: "republish", timestamp: new Date().toISOString() };
        (0, node_fs_1.appendFileSync)(file, JSON.stringify(entry) + "\n");
    }
    catch (_a) {
        // ignore audit errors
    }
}
function republishShop(id, root) {
    if (root === void 0) { root = process.cwd(); }
    if (!SHOP_ID_REGEX.test(id)) {
        throw new Error("Invalid shop ID: ".concat(id));
    }
    var upgradeFile = (0, node_path_1.join)(root, "data", "shops", id, "upgrade.json");
    var hadUpgradeFile = (0, node_fs_1.existsSync)(upgradeFile);
    if (hadUpgradeFile) {
        readUpgradeMeta(root, id);
        (0, node_fs_1.unlinkSync)(upgradeFile);
    }
    saveHistory(root, id);
    run("pnpm", ["--filter", "apps/".concat(id), "build"]);
    run("pnpm", ["--filter", "apps/".concat(id), "deploy"]);
    updateStatus(root, id);
    if (hadUpgradeFile && (0, node_fs_1.existsSync)(upgradeFile)) {
        (0, node_fs_1.unlinkSync)(upgradeFile);
    }
    var appDir = (0, node_path_1.join)(root, "apps", id);
    var upgradeChanges = (0, node_path_1.join)(appDir, "upgrade-changes.json");
    if ((0, node_fs_1.existsSync)(upgradeChanges)) {
        (0, node_fs_1.unlinkSync)(upgradeChanges);
    }
    removeBakFiles(appDir);
    auditRepublish(root, id);
}
function main() {
    var shopId = process.argv[2];
    if (!shopId) {
        console.error("Usage: pnpm ts-node scripts/src/republish-shop.ts <shopId>");
        process.exit(1);
    }
    try {
        republishShop(shopId);
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
