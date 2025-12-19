import { buildInfo } from "@/lib/build-info";

export default function BuildStamp({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Build {buildInfo.sha} | {buildInfo.time} | {buildInfo.mode}
    </span>
  );
}
