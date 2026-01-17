const { execFileSync } = require("node:child_process");

function afterNthSpace(line, count) {
  let index = -1;
  for (let i = 0; i < count; i += 1) {
    index = line.indexOf(" ", index + 1);
    if (index === -1) return "";
  }
  return line.slice(index + 1);
}

function getField(line, fieldIndex) {
  let start = 0;
  for (let i = 0; i < fieldIndex; i += 1) {
    const space = line.indexOf(" ", start);
    if (space === -1) return null;
    start = space + 1;
  }
  const end = line.indexOf(" ", start);
  return end === -1 ? line.slice(start) : line.slice(start, end);
}

function parseStatusV2Z(buf) {
  const lines = buf.toString("utf8").split("\0");
  const partiallyStagedPaths = new Set();
  const unmergedPaths = new Set();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith("#")) continue;

    const recordType = line[0];
    const xy = getField(line, 1);

    if (!xy || xy.length < 2) continue;

    const indexStatus = xy[0];
    const worktreeStatus = xy[1];

    if (recordType === "1") {
      const path = afterNthSpace(line, 8);
      if (indexStatus !== "." && worktreeStatus !== ".") partiallyStagedPaths.add(path);
      continue;
    }

    if (recordType === "2") {
      const path = afterNthSpace(line, 9);
      if (indexStatus !== "." && worktreeStatus !== ".") partiallyStagedPaths.add(path);
      // When `-z` is used, renamed/copied entries include a second NUL-separated origPath.
      i += 1;
      continue;
    }

    if (recordType === "u") {
      const path = afterNthSpace(line, 10);
      unmergedPaths.add(path);
      continue;
    }
  }

  return { partiallyStagedPaths, unmergedPaths };
}

function main() {
  const status = execFileSync(
    "git",
    ["status", "--porcelain=v2", "-z", "--untracked-files=no"],
    { stdio: ["ignore", "pipe", "inherit"] }
  );

  const { partiallyStagedPaths, unmergedPaths } = parseStatusV2Z(status);

  if (unmergedPaths.size) {
    console.error("------------------------------------------------------------------");
    console.error("COMMIT BLOCKED: Unmerged paths detected");
    console.error("------------------------------------------------------------------");
    console.error("");
    console.error("Resolve merge conflicts before committing:");
    for (const path of Array.from(unmergedPaths).sort()) console.error(`  - ${path}`);
    console.error("");
    process.exit(1);
  }

  if (!partiallyStagedPaths.size) return;

  console.error("------------------------------------------------------------------");
  console.error("COMMIT BLOCKED: Partially staged files detected");
  console.error("------------------------------------------------------------------");
  console.error("");
  console.error("This repo blocks partial staging because lint-staged runs with `--no-stash`.");
  console.error("With lint-staged 15.x behavior, partially staged files can result in");
  console.error("unstaged hunks being staged during lint-staged's apply phase.");
  console.error("");
  console.error("Fix by staging the full file (or splitting changes into separate files):");
  for (const path of Array.from(partiallyStagedPaths).sort()) console.error(`  - ${path}`);
  console.error("");
  console.error("Common fixes:");
  console.error("  - Stage full files: git add <file>");
  console.error("  - Or split the change into separate commits by file boundaries");
  console.error("");
  process.exit(1);
}

main();
