const fs = require('node:fs');
const cp = require('node:child_process');
cp.spawnSync = (command, args, options) => {
  fs.writeFileSync(process.env.SPAWN_SYNC_LOG, JSON.stringify({ command, args, options }));
  return { status: 0 };
};
