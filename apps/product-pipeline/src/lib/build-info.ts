export const buildInfo = {
  sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "local",
  time: process.env.NEXT_PUBLIC_BUILD_TIME ?? "dev",
  mode: process.env.NEXT_PUBLIC_PIPELINE_MODE ?? "draft",
};
