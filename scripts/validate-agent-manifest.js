#!/usr/bin/env node

/**
 * Validate Agent Skills Manifest
 *
 * Validates .agents/skills/manifest.yaml:
 * - YAML syntax is valid
 * - All referenced skill paths exist (either in .agents/skills/ or via 'location' field)
 * - No orphan skills (files in skills/ not in manifest, excluding README.md and TEMPLATE.md)
 * - Required fields present
 *
 * Usage: node scripts/validate-agent-manifest.js
 * Exit: 0 on success, 1 on validation failure
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const MANIFEST_PATH = '.agents/skills/manifest.yaml';
const SKILLS_DIR = '.agents/skills';
const LEGACY_PROMPTS_DIR = '.claude/prompts';

// Files in skills/ that are not actual skills
const IGNORED_FILES = ['manifest.yaml', 'README.md', 'TEMPLATE.md'];

// Subdirectories in skills/
const SKILL_SUBDIRS = ['workflows', 'components', 'testing', 'domain'];

function error(msg) {
  console.error(`❌ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

function validateManifest() {
  const errors = [];
  const warnings = [];

  // Check manifest exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    error(`Manifest not found: ${MANIFEST_PATH}`);
    return 1;
  }

  // Parse YAML
  let manifest;
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
    manifest = yaml.load(content);
  } catch (e) {
    error(`Invalid YAML in manifest: ${e.message}`);
    return 1;
  }

  success('YAML syntax is valid');

  // Check required top-level fields
  if (!manifest.version) {
    errors.push('Missing required field: version');
  }
  if (!manifest.skills || !Array.isArray(manifest.skills)) {
    errors.push('Missing or invalid required field: skills (must be array)');
    return reportResults(errors, warnings);
  }

  // Track all skill paths for orphan detection
  const manifestSkillPaths = new Set();
  const manifestSkillLocations = new Set();

  // Validate each skill entry
  for (const skill of manifest.skills) {
    const skillId = skill.name || '(unnamed)';

    // Required fields
    if (!skill.name) {
      errors.push(`Skill missing required field: name`);
    }
    if (!skill.path) {
      errors.push(`Skill '${skillId}' missing required field: path`);
    }
    if (!skill.load) {
      errors.push(`Skill '${skillId}' missing required field: load`);
    } else if (!['always', 'on-demand'].includes(skill.load)) {
      errors.push(`Skill '${skillId}' has invalid load value: ${skill.load} (must be 'always' or 'on-demand')`);
    }

    // Track the path
    if (skill.path) {
      manifestSkillPaths.add(skill.path);
    }

    // Check skill file exists
    if (skill.path) {
      const fullPath = path.join(SKILLS_DIR, skill.path);
      const legacyLocation = skill.location;

      if (legacyLocation) {
        // Skill not yet migrated - check legacy location
        manifestSkillLocations.add(legacyLocation);
        if (!fs.existsSync(legacyLocation)) {
          errors.push(`Skill '${skillId}' references non-existent legacy location: ${legacyLocation}`);
        }
      } else {
        // Skill should be at .agents/skills/<path>
        if (!fs.existsSync(fullPath)) {
          errors.push(`Skill '${skillId}' references non-existent path: ${fullPath}`);
        }
      }
    }
  }

  // Check for orphan skills in .agents/skills/ subdirectories
  for (const subdir of SKILL_SUBDIRS) {
    const subdirPath = path.join(SKILLS_DIR, subdir);
    if (fs.existsSync(subdirPath)) {
      const files = fs.readdirSync(subdirPath);
      for (const file of files) {
        if (file.endsWith('.md') && !IGNORED_FILES.includes(file)) {
          const relativePath = `${subdir}/${file}`;
          if (!manifestSkillPaths.has(relativePath)) {
            errors.push(`Orphan skill (not in manifest): ${relativePath}`);
          }
        }
      }
    }
  }

  // Check for orphan stub files in .claude/prompts/ that redirect but aren't tracked
  // (This is a warning, not an error - stubs are expected during migration)
  if (fs.existsSync(LEGACY_PROMPTS_DIR)) {
    const legacyFiles = fs.readdirSync(LEGACY_PROMPTS_DIR);
    for (const file of legacyFiles) {
      if (file.endsWith('.md') && !['README.md'].includes(file)) {
        const fullPath = path.join(LEGACY_PROMPTS_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check if it's a stub file (redirects to .agents/)
        if (content.includes('# Moved') && content.includes('.agents/')) {
          // This is fine - it's a migration stub
        } else if (!manifestSkillLocations.has(fullPath)) {
          // Real skill file not referenced in manifest
          warnings.push(`Skill in legacy location not referenced in manifest: ${fullPath}`);
        }
      }
    }
  }

  return reportResults(errors, warnings);
}

function reportResults(errors, warnings) {
  console.log('');

  for (const w of warnings) {
    warn(w);
  }

  for (const e of errors) {
    error(e);
  }

  console.log('');

  if (errors.length > 0) {
    console.log(`Validation failed: ${errors.length} error(s), ${warnings.length} warning(s)`);
    return 1;
  }

  if (warnings.length > 0) {
    console.log(`Validation passed with ${warnings.length} warning(s)`);
  } else {
    success('Manifest validation passed');
  }

  return 0;
}

// Run validation
const exitCode = validateManifest();
process.exit(exitCode);
