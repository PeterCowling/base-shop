#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

/* ---------- utils ---------- */
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

function readJSONC(p) {
  const s = read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')      // /* comments */
    .replace(/(^|[^:])\/\/.*$/gm, '$1')    // // comments
    .replace(/,\s*([}\]])/g, '$1');        // trailing commas
  return JSON.parse(s);
}
function writeJSON(p, j) { write(p, JSON.stringify(j, null, 2) + '\n'); }
function backupOnce(p) { const bak = p + '.bak'; if (!fs.existsSync(bak)) fs.copyFileSync(p, bak); }
function relToRootBundler(fromTsconfig) {
  const rel = path.relative(path.dirname(fromTsconfig), path.join(ROOT, 'tsconfig.bundler.json'));
  return (rel || 'tsconfig.bundler.json').split(path.sep).join('/');
}
function ensureBundlerCompilerOptions(j) {
  j.compilerOptions = j.compilerOptions || {};
  j.compilerOptions.module = 'ESNext';
  j.compilerOptions.moduleResolution = 'Bundler';
  if (!has(j.compilerOptions, 'jsx')) j.compilerOptions.jsx = 'react-jsx';
  // Intentionally NOT forcing verbatimModuleSyntax here to avoid introducing new errors.
}
function patchTsconfig(tsPath) {
  if (!fs.existsSync(tsPath)) { console.log('skip (missing):', tsPath); return; }
  let j;
  try { j = readJSONC(tsPath); } catch (e) { console.log('skip (parse-error):', tsPath); return; }

  const before = JSON.stringify(j);
  const rel = relToRootBundler(tsPath);
  const ext = j.extends || '';
  if (!ext.includes('tsconfig.bundler.json')) {
    j.extends = rel.startsWith('.') ? rel : './' + rel;
  }
  ensureBundlerCompilerOptions(j);

  const after = JSON.stringify(j);
  if (after !== before) { backupOnce(tsPath); writeJSON(tsPath, j); console.log('✓ updated', tsPath); }
  else { console.log('• no change', tsPath); }
}
function detectBadSrcPathAliases(j) {
  const bad = [];
  const paths = (j.compilerOptions && j.compilerOptions.paths) || {};
  const entries = Object.entries(paths);
  for (const [alias, arr] of entries) {
    const vals = Array.isArray(arr) ? arr : [arr];
    for (const v of vals) {
      if (typeof v !== 'string') continue;
      if (v.includes('../ui/src/') || v.includes('../platform-core/src/')) bad.push({ alias, target: v });
    }
  }
  return bad;
}
function scanTsconfigs(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (/^tsconfig(\..+)?\.json$/.test(e.name)) out.push(p);
    }
  }
  return out;
}

/* ---------- 0) ensure root Bundler profile ---------- */
const bundlerCfg = path.join(ROOT, 'tsconfig.bundler.json');
if (!fs.existsSync(bundlerCfg)) {
  const basePath = fs.existsSync(path.join(ROOT, 'tsconfig.base.json')) ? './tsconfig.base.json' : undefined;
  const json = {
    ...(basePath ? { extends: basePath } : {}),
    compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx' }
  };
  writeJSON(bundlerCfg, json);
  console.log('✓ created tsconfig.bundler.json');
} else {
  console.log('• exists tsconfig.bundler.json');
}

/* ---------- 1) flip NodeNext packages to Bundler ---------- */
[
  'apps/cms/tsconfig.json',
  'packages/zod-utils/tsconfig.json'
].forEach(patchTsconfig);

/* ---------- 2) enforce Bundler on core packages (idempotent) ---------- */
[
  'packages/ui/tsconfig.json',
  'packages/template-app/tsconfig.json',
  'packages/platform-core/tsconfig.json'
].forEach(patchTsconfig);

/* ---------- 3) warn about Node/NodeNext projects pointing at ../ui/src or ../platform-core/src ---------- */
const allTs = scanTsconfigs(ROOT);
const warnings = [];
for (const tsPath of allTs) {
  try {
    const j = readJSONC(tsPath);
    const co = j.compilerOptions || {};
    const resMode = (co.moduleResolution || '').toLowerCase();
    if (resMode === 'bundler') continue;
    const bad = detectBadSrcPathAliases(j);
    if (bad.length) warnings.push({ tsPath, resMode, bad });
  } catch {}
}
if (warnings.length) {
  console.log('\n⚠ Remaining Node/NodeNext tsconfigs referencing ../ui/src or ../platform-core/src:');
  for (const w of warnings) {
    console.log(`- ${w.tsPath} (moduleResolution: ${w.resMode})`);
    for (const a of w.bad) console.log(`   ${a.alias} -> ${a.target}`);
  }
  console.log('  Fix: convert these to Bundler (preferred) or point aliases to package/dist instead of src.\n');
} else {
  console.log('• No Node/NodeNext + src alias leaks detected.');
}

/* ---------- 4) optional: inject transpilePackages into Next (JS files only) ---------- */
(function ensureNextTranspile() {
  const files = [
    'packages/template-app/next.config.js',
    'packages/template-app/next.config.mjs'
  ].map(f => path.join(ROOT, f)).filter(fs.existsSync);
  if (!files.length) { console.log('• no next.config.js/mjs found (skipped transpilePackages)'); return; }

  const pkgs = ['@acme/ui', '@acme/platform-core'];

  for (const file of files) {
    const src = read(file);
    if (/transpilePackages\s*:/.test(src)) { console.log('• transpilePackages already set in', path.relative(ROOT, file)); continue; }

    let out = src;
    if (/export\s+default\s*\{\s*/.test(src)) {
      out = src.replace(/export\s+default\s*\{\s*/, `export default { transpilePackages: ${JSON.stringify(pkgs)}, `);
    } else if (/module\.exports\s*=\s*\{\s*/.test(src)) {
      out = src.replace(/module\.exports\s*=\s*\{\s*/, `module.exports = { transpilePackages: ${JSON.stringify(pkgs)}, `);
    } else {
      out = src + `\n\nmodule.exports = { transpilePackages: ${JSON.stringify(pkgs)} };\n`;
    }
    backupOnce(file);
    write(file, out);
    console.log('✓ injected transpilePackages into', path.relative(ROOT, file));
  }
})();

console.log('\nDone.');
