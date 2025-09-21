declare module "../../functions/src/previewScheduler.js" {
  const sched: {
    scheduled(): Promise<void>;
  };
  export default sched;
}

