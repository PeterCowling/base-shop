import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');
const cardsDir = path.join(rootDir, 'docs/business-os/cards');

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

function addMissingHeaders(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check if file has YAML frontmatter
  if (lines[0] !== '---') {
    console.log(`Skipping ${path.relative(rootDir, filePath)} - no YAML frontmatter found`);
    return;
  }

  // Find the end of frontmatter
  let frontmatterEnd = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      frontmatterEnd = i;
      break;
    }
  }

  if (frontmatterEnd === -1) {
    console.log(`Skipping ${path.relative(rootDir, filePath)} - malformed frontmatter`);
    return;
  }

  // Parse frontmatter to check for Status and Last-updated
  let hasStatus = false;
  let hasLastUpdated = false;

  for (let i = 1; i < frontmatterEnd; i++) {
    const line = lines[i];
    if (line.startsWith('Status:')) {
      hasStatus = true;
    }
    if (line.startsWith('Last-updated:')) {
      hasLastUpdated = true;
    }
  }

  // Determine appropriate status based on file location and name
  let defaultStatus = 'Active';
  const fileName = path.basename(filePath);

  if (fileName.includes('OPP-')) {
    defaultStatus = 'Draft'; // Opportunities are typically in draft
  } else if (filePath.includes('/ideas/')) {
    defaultStatus = 'Draft';
  } else if (fileName.includes('ENG-')) {
    defaultStatus = 'Active'; // Engineering cards are typically active
  }

  // Add missing headers to frontmatter
  const headersToAdd: string[] = [];

  if (!hasStatus) {
    headersToAdd.push(`Status: ${defaultStatus}`);
  }

  if (!hasLastUpdated) {
    headersToAdd.push(`Last-updated: ${today}`);
  }

  if (headersToAdd.length > 0) {
    // Insert headers before the closing ---
    lines.splice(frontmatterEnd, 0, ...headersToAdd);

    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf-8');

    console.log(`✓ Updated ${path.relative(rootDir, filePath)}: added ${headersToAdd.join(', ')}`);
  }
}

function processDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Process .user.md and .agent.md files
      if (entry.name.endsWith('.user.md') || entry.name.endsWith('.agent.md')) {
        addMissingHeaders(fullPath);
      }
    }
  }
}

console.log('Adding missing headers to card files...');
processDirectory(cardsDir);

// Also process ideas directory
const ideasDir = path.join(rootDir, 'docs/business-os/ideas');
if (fs.existsSync(ideasDir)) {
  processDirectory(ideasDir);
}

console.log('Done adding headers!');
