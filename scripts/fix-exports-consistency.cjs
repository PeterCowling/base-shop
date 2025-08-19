#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJSON(p, j) { fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n'); }
function backupOnce(p) { const b = p + '.bak'; if (!fs.existsSync(b)) fs.copyFileSync(p, b); }

const ROOT = process.cwd();
const PKG_DIRS = ['packages', 'apps']; // scan both; adjust if needed

function isSubpathKey(k) { return k === '.' || k.startsWith('./'); }
function hasMixedExports(exp) {
  if (!exp || typeof exp !== 'object' || Array.isArray(exp)) return false;
  const keys = Object.keys(exp);
  if (keys.length === 0) return false;
  const hasSub = keys.some(isSubpathKey);
  const hasNon = keys.some(k => !isSubpathKey(k));
  return hasSub && hasNon;
}

/**
 * Convert a mixed exports object to the Node-compliant "subpath map" form:
 *   - Move top-level condition keys (import/require/default/types/…)
 *     under "." (creating it if needed).
 *   - Keep existing "./subpath" entries as-is.
 *   - Normalize string entries for "." into { default: "…" }.
 */
function normalizeExports(pkgJson) {
  const exp = pkgJson.exports;
  if (!exp) return { changed: false };

  // If exports is a string or array: wrap into "." subpath
  if (typeof exp === 'string' || Array.isArray(exp)) {
    pkgJson.exports = { '.': exp };
    return { changed: true, reason: 'wrap-string-or-array' };
  }

  if (typeof exp !== 'object') return { changed: false };

  const keys = Object.keys(exp);
  if (keys.length === 0) return { changed: false };

  if (!hasMixedExports(exp)) {
    // Also normalize "." if it is a string (not required, but cleaner)
    if (typeof exp['.'] === 'string') {
      const mainStr = exp['.'];
      exp['.'] = { default: mainStr };
      return { changed: true, reason: 'normalize-dot-string' };
    }
    return { changed: false };
  }

  // Mixed: split into subpath vs condition keys
  const subKeys = keys.filter(isSubpathKey);
  const condKeys = keys.filter(k => !isSubpathKey(k));

  // Build/normalize the "." entry
  let dot = exp['.'];
  if (dot === undefined) dot = {};
  if (typeof dot === 'string') dot = { default: dot };

  // Move top-level condition keys under "."
  for (const k of condKeys) {
    const val = exp[k];
    // Preserve whatever value it held; Node allows nested condition maps under "."
    // Special-case "types" so TS can pick it up:
    if (k === 'types' && typeof val === 'string') {
      dot.types = val;
    } else {
      // If dot[k] already exists, prefer existing dot[k]
      if (dot[k] === undefined) dot[k] = val;
    }
    delete exp[k];
  }

  // Put the normalized dot back
  exp['.'] = dot;

  // Leave "./…"" entries untouched. If any subpath value is string, keep it string.

  return { changed: true, reason: 'mixed-to-subpath-map' };
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (e.isFile() && e.name === 'package.json') files.push(p);
  }
  return files;
}

function fixOne(pkgPath) {
  let j;
  try { j = readJSON(pkgPath); } catch { return { pkgPath, skipped: 'parse-error' }; }

  if (!j.exports) return { pkgPath, skipped: 'no-exports' };

  const before = JSON.stringify(j.exports);
  const res = normalizeExports(j);
  const after = JSON.stringify(j.exports);

  if (res.changed && before !== after) {
    backupOnce(pkgPath);
    writeJSON(pkgPath, j);
    return { pkgPath, fixed: true, reason: res.reason };
  }
  return { pkgPath, fixed: false, skipped: 'no-change' };
}

function main() {
  // 1) First, ensure @acme/zod-utils is fixed (explicitly).
  const zodPkg = path.join(ROOT, 'packages', 'zod-utils', 'package.json');
  if (fs.existsSync(zodPkg)) {
    const j = readJSON(zodPkg);
    j.type = j.type || 'module';
    j.main = j.main || './dist/index.js';
    j.module = j.module || './dist/index.js';
    j.types = j.types || './dist/index.d.ts';

    // If exports is missing or obviously wrong, set a safe default
    const want = {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        default: './dist/index.js'
      },
      './*': {
        types: './dist/*.d.ts',
        import: './dist/*.js',
        default: './dist/*.js'
      }
    };

    if (!j.exports || hasMixedExports(j.exports)) {
      j.exports = want;
      backupOnce(zodPkg);
      writeJSON(zodPkg, j);
      console.log('✓ normalized exports for @acme/zod-utils');
    } else {
      // Even if not mixed, normalize "." if string
      const before = JSON.stringify(j.exports);
      const res = normalizeExports(j);
      if (res.changed && JSON.stringify(j.exports) !== before) {
        backupOnce(zodPkg);
        writeJSON(zodPkg, j);
        console.log('✓ normalized existing exports for @acme/zod-utils');
      } else {
        console.log('• @acme/zod-utils exports already OK');
      }
    }
  } else {
    console.log('• skip: packages/zod-utils/package.json not found');
  }

  // 2) Bulk scan/fix other packages
  const pkgJsons = PKG_DIRS.flatMap(d => walk(path.join(ROOT, d)));
  const results = [];
  for (const p of pkgJsons) {
    // Skip zod again (already handled)
    if (p.endsWith('/packages/zod-utils/package.json')) continue;
    const r = fixOne(p);
    results.push(r);
  }

  const fixed = results.filter(r => r.fixed);
  const mixedLeft = [];
  for (const r of results) {
    if (r.fixed) continue;
    try {
      const j = readJSON(r.pkgPath);
      if (j.exports && hasMixedExports(j.exports)) mixedLeft.push(r.pkgPath);
    } catch {}
  }

  if (fixed.length) {
    console.log('\nFixed package.json exports in:');
    for (const f of fixed) console.log(' -', path.relative(ROOT, f.pkgPath), f.reason ? `(${f.reason})` : '');
  } else {
    console.log('\n• No other package.json exports needed changes.');
  }

  if (mixedLeft.length) {
    console.log('\n⚠ Still mixed exports in:');
    for (const p of mixedLeft) console.log(' -', path.relative(ROOT, p));
    console.log('  Please inspect these manually; automatic normalization was skipped.');
  }

  console.log('\nDone.');
}

main();
