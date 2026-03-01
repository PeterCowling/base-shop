import { NextResponse } from "next/server";

export function isLocalFsRuntimeEnabled(): boolean {
  if (process.env.XA_UPLOADER_LOCAL_FS_DISABLED === "1") return false;
  if (process.env.NEXT_RUNTIME === "edge") return false;
  return true;
}

export function localFsUnavailableResponse() {
  return NextResponse.json(
    { ok: false, error: "service_unavailable", reason: "local_fs_unavailable" },
    { status: 503 },
  );
}
