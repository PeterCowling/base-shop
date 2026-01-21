const path = require("path");

// Load the route runtime
const projectRoot = path.resolve(__dirname, "..");

// We need to use ts-node or tsx to load TypeScript files
const { execSync } = require("child_process");

// Simpler approach: parse the build output
const result = execSync(
  'grep -E "^├\\s+├|^├\\s+└" /tmp/build-output.txt 2>/dev/null || echo "No build output found"',
  { cwd: projectRoot, encoding: "utf-8" }
);

console.log(result);
