#!/usr/bin/env node
/*
  Lightweight drift checks for always-on agent context files.
  - Warn if PROJECT_DIGEST.md exceeds 200 lines
  - Warn if CLAUDE.md exceeds 100 lines
  - Warn if 3-line blocks are duplicated between AGENTS.md and PROJECT_DIGEST.md

  Usage:
    node scripts/validate-agent-context.cjs
    node scripts/validate-agent-context.cjs --strict   # exit 1 on warnings
*/

const fs = require('fs');
const path = require('path');

const STRICT = process.argv.includes('--strict') || process.env.STRICT === '1';

const FILES = {
  agents: 'AGENTS.md',
  digest: 'PROJECT_DIGEST.md',
  claude: 'CLAUDE.md'
};

const LIMITS = {
  digestMax: 200,
  claudeMax: 100
};

function readLines(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  const text = fs.readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/);
  return { text, lines };
}

function stripFrontmatter(lines) {
  if (lines[0] !== '---') return lines;
  const end = lines.indexOf('---', 1);
  if (end === -1) return lines;
  return lines.slice(end + 1);
}

function isIgnorableLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (t === '---' || t === '```') return true;
  if (t.startsWith('#')) return true;
  return false;
}

function isMeaningfulWindow(windowLines) {
  const nonIgnorable = windowLines.filter((line) => !isIgnorableLine(line));
  if (nonIgnorable.length < 2) return false;
  const letters = windowLines.join('\n').replace(/[^A-Za-z0-9]/g, '').length;
  return letters >= 10;
}

function buildWindowMap(lines, size) {
  const map = new Map();
  for (let i = 0; i <= lines.length - size; i += 1) {
    const windowLines = lines.slice(i, i + size);
    if (!isMeaningfulWindow(windowLines)) continue;
    const key = windowLines.join('\n');
    if (!map.has(key)) {
      map.set(key, i);
    }
  }
  return map;
}

function checkLineLimits() {
  const warnings = [];
  const digest = readLines(FILES.digest).lines.length;
  const claude = readLines(FILES.claude).lines.length;

  if (digest > LIMITS.digestMax) {
    warnings.push(
      `PROJECT_DIGEST.md has ${digest} lines (limit ${LIMITS.digestMax}).`
    );
  }

  if (claude > LIMITS.claudeMax) {
    warnings.push(`CLAUDE.md has ${claude} lines (limit ${LIMITS.claudeMax}).`);
  }

  return warnings;
}

function checkDuplicateBlocks() {
  const warnings = [];
  const agentsLines = stripFrontmatter(readLines(FILES.agents).lines);
  const digestLines = stripFrontmatter(readLines(FILES.digest).lines);

  const windowSize = 3;
  const agentsMap = buildWindowMap(agentsLines, windowSize);

  let found = 0;
  const maxExamples = 3;

  for (let i = 0; i <= digestLines.length - windowSize; i += 1) {
    const windowLines = digestLines.slice(i, i + windowSize);
    if (!isMeaningfulWindow(windowLines)) continue;
    const key = windowLines.join('\n');
    if (agentsMap.has(key)) {
      if (found < maxExamples) {
        const agentsLine = agentsMap.get(key) + 1;
        const digestLine = i + 1;
        warnings.push(
          `Duplicate 3-line block found (AGENTS.md#L${agentsLine}, PROJECT_DIGEST.md#L${digestLine}).`
        );
      }
      found += 1;
    }
  }

  if (found > maxExamples) {
    warnings.push(`Duplicate blocks found: ${found} total (showing first ${maxExamples}).`);
  }

  return warnings;
}

function run() {
  const warnings = [];
  warnings.push(...checkLineLimits());
  warnings.push(...checkDuplicateBlocks());

  if (warnings.length === 0) {
    console.log('OK: Agent context drift checks passed.');
    return;
  }

  console.warn('WARN: Agent context drift checks found issues:');
  warnings.forEach((warning) => console.warn(`  - ${warning}`));

  if (STRICT) {
    console.error('FAIL: Strict mode enabled; refusing to continue.');
    process.exit(1);
  }
}

run();
