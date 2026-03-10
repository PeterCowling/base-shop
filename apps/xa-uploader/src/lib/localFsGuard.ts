import { NextResponse } from "next/server";

export function isLocalFsRuntimeEnabled(): boolean {
  return false;
}

export function catalogContractUnavailableResponse() {
  return NextResponse.json(
    { ok: false, error: "service_unavailable", reason: "catalog_contract_unavailable" },
    { status: 503 },
  );
}

export function localFsUnavailableResponse() {
  return catalogContractUnavailableResponse();
}
