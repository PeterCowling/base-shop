/**
 * VS Code Jest extension config.
 *
 * Uses Jest's `projects` feature to run each package with its own config.
 * This avoids the "? explosion" from Turbo while respecting per-package
 * options (useCjs, skipEnvMocks, etc.).
 *
 * Usage: configured in .vscode/settings.json via jest.jestCommandLine
 */

const fs = require('fs');
const path = require('path');

// Auto-discover all packages/apps with a jest.config.cjs
const dirs = [
  ...fs.readdirSync('apps').map((d) => `apps/${d}`),
  ...fs.readdirSync('packages').map((d) => `packages/${d}`),
  'scripts',
];

const projects = dirs.filter((dir) => {
  const configPath = path.join(__dirname, dir, 'jest.config.cjs');
  return fs.existsSync(configPath);
});

module.exports = {
  projects,
  // Prevent root-level test discovery (delegate entirely to projects)
  testMatch: [],
};
