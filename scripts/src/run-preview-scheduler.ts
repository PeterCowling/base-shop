import sched from "../../functions/src/previewScheduler";

async function main() {
  await sched.scheduled();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

