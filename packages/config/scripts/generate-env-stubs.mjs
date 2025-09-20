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

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('env dir not found:', ROOT);
    process.exit(1);
  }
  const entries = fs.readdirSync(ROOT);
  entries.forEach((entry) => {
    const full = path.join(ROOT, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) return; // ignore directories (including __tests__)
    if (!entry.endsWith('.ts')) return;
    if (isTestFile(entry)) return;
    generateStub(full);
  });
}

main();
