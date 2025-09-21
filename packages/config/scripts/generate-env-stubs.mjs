// packages/config/scripts/generate-env-stubs.mjs
// Generates lightweight JS stubs next to each TS env module so runtime code
// can import stable .js paths while TypeScript uses the .ts sources.
//
// The stubs simply re-export from the sibling .ts file. This keeps dev builds
// simple and avoids coupling to build output structure.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src/env');

function isTestFile(name) {
  return name.includes('__tests__') || name.endsWith('.test.ts') || name.endsWith('.spec.ts');
}

function generateStub(tsPath) {
  const dir = path.dirname(tsPath);
  const base = path.basename(tsPath, '.ts');
  const jsPath = path.join(dir, `${base}.js`);
  const content = `export * from "./${base}.ts";\n`;
  if (!fs.existsSync(jsPath) || fs.readFileSync(jsPath, 'utf8') !== content) {
    fs.writeFileSync(jsPath, content, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`stub: ${path.relative(process.cwd(), jsPath)}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      walk(full);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (isTestFile(entry.name)) continue;
    generateStub(full);
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('env dir not found:', ROOT);
    process.exit(1);
  }
  walk(ROOT);
}

main();
