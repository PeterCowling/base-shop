import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lighthouseBin = path.resolve(__dirname, '../node_modules/.bin/lighthouse');

const url = process.argv[2] || 'http://localhost:3000';
const output = process.argv[3] || 'seo-report.html';

const args = [
  url,
  '--chrome-flags=--headless',
  '--only-categories=seo',
  '--preset=desktop',
  '--output=html',
  `--output-path=${output}`,
];

const child = spawn(lighthouseBin, args, { stdio: 'inherit' });

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Lighthouse audit failed with code ${code}`);
    process.exit(code ?? 1);
  }
});
