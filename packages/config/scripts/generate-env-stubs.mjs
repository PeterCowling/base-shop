import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.join(__dirname, '..', 'src', 'env');

async function generate() {
  const entries = await fs.readdir(envDir);
  const implFiles = entries.filter((f) => f.endsWith('.impl.ts'));
  await Promise.all(
    implFiles.map(async (impl) => {
      const base = impl.replace(/\.impl\.ts$/, '');
      const stubPath = path.join(envDir, `${base}.js`);
      const content = `export * from "./${base}.impl.js";\n`;
      await fs.writeFile(stubPath, content, 'utf8');
    })
  );
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
