#!/usr/bin/env node
/**
 * Analyze Next.js build chunks and categorize them deterministically.
 *
 * Usage:
 *   node apps/brikette/scripts/perf/analyze-chunks.mjs
 *
 * Requires a completed build: pnpm --filter @apps/brikette build
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHUNKS_DIR = join(__dirname, '../../.next/static/chunks');

/**
 * Recursively find all chunk files (.js and .css, excluding .map)
 */
function findChunks(dir, baseDir = dir) {
  let files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(findChunks(fullPath, baseDir));
      } else if (entry.isFile() && /\.(js|css)$/.test(entry.name) && !entry.name.endsWith('.map')) {
        files.push({
          path: fullPath,
          relativePath: relative(baseDir, fullPath),
          name: entry.name,
          size: statSync(fullPath).size,
        });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  return files;
}

/**
 * Categorize a chunk based on its path, name, and content.
 * Returns one of: json, icon, component, route, framework, vendor, other
 */
function categorizeChunk(file) {
  const { relativePath, name } = file;

  // Read first 50KB to check content markers (JSON chunks can be large)
  let content = '';
  try {
    const buffer = readFileSync(file.path, { encoding: 'utf8' });
    content = buffer.slice(0, 50000);
  } catch (err) {
    // If we can't read, categorize by path/name only
  }

  // Framework chunks (check first since they have distinctive names)
  if (
    name.startsWith('framework-') ||
    name.startsWith('webpack-') ||
    name.startsWith('main-app-')
  ) {
    return 'framework';
  }

  // App route chunks (check by path)
  if (relativePath.startsWith('app/')) {
    return 'route';
  }

  // JSON translation chunks: look for JSON.parse patterns (minified locale data)
  if (
    content.includes('.exports=JSON.parse(') ||
    content.includes('exports=JSON.parse(') ||
    // Legacy patterns
    content.includes('src/locales/') ||
    relativePath.includes('/locales-') ||
    (content.includes('"lng":') && content.includes('"ns":'))
  ) {
    return 'json';
  }

  // Icon chunks: check for known icon library paths or patterns
  if (
    content.includes('@radix-ui/react-icons') ||
    content.includes('lucide-react') ||
    content.includes('react-icons') ||
    relativePath.includes('/icons/') ||
    // SVG path elements are a strong signal
    (content.includes('<path') && content.includes('d="M') && content.includes('</path>'))
  ) {
    return 'icon';
  }

  // Component/UI chunks: explicit component paths
  if (
    content.includes('src/components/') ||
    content.includes('packages/ui/src/') ||
    relativePath.includes('/components/')
  ) {
    return 'component';
  }

  // Vendor chunks: node_modules
  if (
    content.includes('node_modules/') ||
    relativePath.includes('vendor')
  ) {
    return 'vendor';
  }

  return 'other';
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Main analysis
 */
function analyzeChunks() {
  console.log('🔍 Analyzing Brikette build chunks...\n');
  console.log(`📁 Chunks directory: ${CHUNKS_DIR}\n`);

  const chunks = findChunks(CHUNKS_DIR);

  if (chunks.length === 0) {
    console.error('❌ No chunks found. Did you run `pnpm --filter @apps/brikette build`?');
    process.exit(1);
  }

  // Categorize all chunks
  const categories = {};
  for (const chunk of chunks) {
    const category = categorizeChunk(chunk);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(chunk);
  }

  // Calculate totals
  const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
  const totalCount = chunks.length;

  // Sort categories by count (descending)
  const sortedCategories = Object.keys(categories).sort(
    (a, b) => categories[b].length - categories[a].length
  );

  // Print summary table
  console.log('📊 Chunk Breakdown\n');
  console.log('| Category | Count | % of Total | Total Size | Avg Size |');
  console.log('|----------|-------|------------|------------|----------|');

  let sumCount = 0;
  for (const category of sortedCategories) {
    const catChunks = categories[category];
    const count = catChunks.length;
    const size = catChunks.reduce((sum, c) => sum + c.size, 0);
    const percent = ((count / totalCount) * 100).toFixed(1);
    const avgSize = size / count;

    sumCount += count;

    console.log(
      `| ${category.padEnd(8)} | ${String(count).padStart(5)} | ${String(percent + '%').padStart(10)} | ${formatBytes(size).padStart(10)} | ${formatBytes(avgSize).padStart(8)} |`
    );
  }

  console.log('|----------|-------|------------|------------|----------|');
  console.log(
    `| **TOTAL** | ${String(totalCount).padStart(5)} | ${String('100.0%').padStart(10)} | ${formatBytes(totalSize).padStart(10)} | ${formatBytes(totalSize / totalCount).padStart(8)} |`
  );

  // Validation
  console.log('\n✅ Validation');
  console.log(`   Sum of category counts: ${sumCount}`);
  console.log(`   Total chunk files: ${totalCount}`);
  console.log(`   Match: ${sumCount === totalCount ? '✓' : '✗ MISMATCH'}`);

  // Top 10 largest chunks
  console.log('\n📦 Top 10 Largest Chunks\n');
  const sorted = [...chunks].sort((a, b) => b.size - a.size).slice(0, 10);
  for (let i = 0; i < sorted.length; i++) {
    const chunk = sorted[i];
    const category = categorizeChunk(chunk);
    console.log(`${i + 1}. ${formatBytes(chunk.size).padStart(8)} - ${chunk.relativePath} [${category}]`);
  }

  // Return for programmatic use
  return {
    total: totalCount,
    totalSize,
    categories: Object.fromEntries(
      Object.entries(categories).map(([cat, chunks]) => [
        cat,
        {
          count: chunks.length,
          size: chunks.reduce((sum, c) => sum + c.size, 0),
          percent: ((chunks.length / totalCount) * 100).toFixed(1),
        },
      ])
    ),
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeChunks();
}

export { analyzeChunks };
