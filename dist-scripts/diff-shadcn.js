#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var node_child_process_1 = require("node:child_process");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var root = (0, node_path_1.join)(__dirname, "..");
var upstreamDir = (0, node_path_1.join)(root, "node_modules", "@shadcn", "ui", "components");
var localDir = (0, node_path_1.join)(root, "packages", "ui", "components", "ui");
var components = [
    "button",
    "input",
    "card",
    "checkbox",
    "dialog",
    "select",
    "table",
    "textarea",
];
for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
    var name_1 = components_1[_i];
    var upstream = (0, node_path_1.join)(upstreamDir, "".concat(name_1, ".tsx"));
    var local = (0, node_path_1.join)(localDir, "".concat(name_1, ".tsx"));
    if (!(0, node_fs_1.existsSync)(upstream)) {
        console.error("Missing upstream component: ".concat(upstream));
        continue;
    }
    console.log("\nDiff for ".concat(name_1, ":"));
    (0, node_child_process_1.spawnSync)("diff", ["-u", upstream, local], { stdio: "inherit" });
}
