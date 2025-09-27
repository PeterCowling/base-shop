/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS stub intentionally uses require (ENG-1234) */
const fs = require('node:fs');
const cp = require('node:child_process');
cp.spawnSync = (command, args, options) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- writes to temp log path provided via env var (ENG-1234)
  fs.writeFileSync(process.env.SPAWN_SYNC_LOG, JSON.stringify({ command, args, options }));
  return { status: 0 };
};
