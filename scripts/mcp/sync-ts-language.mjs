#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const portFile = resolve(".vscode/.mcp-port");
const claudeSettingsFile = resolve(".claude/settings.json");

function readPort() {
  let value;
  try {
    value = readFileSync(portFile, "utf8").trim();
  } catch (error) {
    throw new Error(`Port file not found: ${portFile}`);
  }
  if (!value || !/^[0-9]+$/.test(value)) {
    throw new Error(`Invalid port value in ${portFile}: ${value}`);
  }
  return value;
}

function readJson(filePath) {
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  const serialized = JSON.stringify(data, null, 2) + "\n";
  writeFileSync(filePath, serialized, "utf8");
}

function updateClaudeSettings(url) {
  let settings;
  try {
    settings = readJson(claudeSettingsFile);
  } catch (error) {
    throw new Error(`Unable to read ${claudeSettingsFile}.`);
  }

  const mcpServers = settings.mcpServers ?? {};
  mcpServers["ts-language"] = {
    type: "url",
    url,
  };
  settings.mcpServers = mcpServers;

  writeJson(claudeSettingsFile, settings);
}

function commandExists(command) {
  try {
    execFileSync("/usr/bin/env", ["bash", "-lc", `command -v ${command}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function runCodex(url) {
  execFileSync("codex", ["mcp", "add", "ts-language", "--url", url], {
    stdio: "inherit",
  });
}

function runClaude(url) {
  execFileSync("claude", ["mcp", "add", "--transport", "http", "ts-language", url], {
    stdio: "inherit",
  });
}

const port = readPort();
const url = `http://127.0.0.1:${port}/mcp`;

updateClaudeSettings(url);

if (commandExists("codex")) {
  runCodex(url);
}

if (commandExists("claude")) {
  runClaude(url);
}

console.log(`Synced ts-language MCP URL: ${url}`);
