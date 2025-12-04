// Minimal fs stub for Storybook webpack builds
module.exports = {
  existsSync: () => false,
  readFileSync: () => "",
  statSync: () => ({ isDirectory: () => false }),
};
