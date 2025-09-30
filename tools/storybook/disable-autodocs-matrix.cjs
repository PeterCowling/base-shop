// tools/storybook/disable-autodocs-matrix.cjs
// Disable autodocs on all Matrix CSF files to avoid conflicts with MDX docs
// and prevent SB9 styled DocsPage crashes.
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const root = process.cwd();
const pattern = 'packages/ui/src/components/**/**/*.Matrix.stories.tsx';

const files = glob.sync(pattern, { cwd: root, absolute: true, nodir: true });

let changed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  // If already has autodocs disabled at meta level, skip
  if (/parameters:\s*{\s*docs:\s*{\s*autodocs:\s*false\s*}/m.test(src)) continue;
  // Replace tags: ['autodocs'] at meta level with parameters: { docs: { autodocs: false } }
  const replaced = src.replace(/(component:\s*[^,]+,\s*)\n\s*tags:\s*\['autodocs'\],?/m, '$1\n  parameters: { docs: { autodocs: false } },');
  if (replaced !== src) {
    fs.writeFileSync(file, replaced, 'utf8');
    changed++;
    continue;
  }
  // If tags are elsewhere or missing, attempt to inject parameters after component line
  const injected = src.replace(/(component:\s*[^,]+,)/m, '$1\n  parameters: { docs: { autodocs: false } },');
  if (injected !== src) {
    fs.writeFileSync(file, injected, 'utf8');
    changed++;
  }
}

console.log(`Processed ${files.length} files, updated ${changed}`);

