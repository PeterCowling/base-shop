import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envDir = join(__dirname, '..', 'src', 'env');

const entries = await readdir(envDir, { withFileTypes: true }).catch(() => []);

await Promise.all(
  entries
    .filter((e) => e.isFile() && e.name.endsWith('.impl.ts'))
    .map(async (e) => {
      const base = e.name.replace(/\.impl\.ts$/, '');
      const stubPath = join(envDir, `${base}.js`);
      const content = `export * from "./${base}.impl.js";\nexport { default } from "./${base}.impl.js";\n`;
      await writeFile(stubPath, content);
    }),
);
