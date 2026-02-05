import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');

// Files missing Type header and their appropriate Type value
const filesToFix: Array<{ path: string; type: string }> = [
  { path: 'docs/business-os/README.md', type: 'Reference' },
  { path: 'docs/business-os/cards/BRIK-ENG-0020/baseline-metrics.md', type: 'Reference' },
  { path: 'docs/contracts/inventory-authority-contract.md', type: 'Contract' },
  { path: 'docs/issues/SUMMARY-seo-audit-fix.md', type: 'Issue' },
  { path: 'docs/issues/seo-audit-scores-manual-test.md', type: 'Issue' },
  { path: 'docs/issues/seo-audit-scores-not-displaying.md', type: 'Issue' },
  { path: 'docs/plans/business-os-card-presentation-fact-find.md', type: 'Fact-find' },
  { path: 'docs/plans/plans-to-cards-migration-analysis.md', type: 'Analysis' },
  { path: 'docs/runbooks/agent-runner-supervision.md', type: 'Runbook' },
  { path: 'docs/runbooks/tunnel-setup.md', type: 'Runbook' },
];

const today = new Date().toISOString().split('T')[0];

function addTypeHeader(filePath: string, type: string) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  // Check if file has frontmatter
  if (lines[0] === '---') {
    // Find end of frontmatter
    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatterEnd = i;
        break;
      }
    }

    if (frontmatterEnd === -1) {
      console.log(`❌ Malformed frontmatter in ${filePath}`);
      return;
    }

    // Check if Type already exists
    let hasType = false;
    for (let i = 1; i < frontmatterEnd; i++) {
      if (lines[i].startsWith('Type:')) {
        hasType = true;
        break;
      }
    }

    if (!hasType) {
      // Add Type header at the beginning of frontmatter (after ---)
      lines.splice(1, 0, `Type: ${type}`);
      const newContent = lines.join('\n');
      fs.writeFileSync(fullPath, newContent, 'utf-8');
      console.log(`✓ Added Type: ${type} to ${filePath}`);
    } else {
      console.log(`  ${filePath} already has Type header`);
    }
  } else {
    // No frontmatter, add it
    const frontmatter = [
      '---',
      `Type: ${type}`,
      `Status: Reference`,
      `Last-updated: ${today}`,
      '---',
      '',
    ];

    const newContent = frontmatter.join('\n') + content;
    fs.writeFileSync(fullPath, newContent, 'utf-8');
    console.log(`✓ Added frontmatter with Type: ${type} to ${filePath}`);
  }
}

console.log('Adding missing Type headers...\n');

for (const { path, type } of filesToFix) {
  addTypeHeader(path, type);
}

console.log('\nDone!');
