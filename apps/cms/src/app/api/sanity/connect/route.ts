import { type NextRequest, NextResponse } from "next/server";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";

import { validateShopName } from "@acme/lib";

interface Body {
  shopId?: string;
  projectId?: string;
  dataset?: string;
  token?: string;
  aclMode?: string;
  createDataset?: boolean;
  enableEditorial?: boolean;
  promoteSchedule?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.shopId) {
    return NextResponse.json(
      { error: "Invalid request", errorCode: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  let shopId: string;
  try {
    shopId = validateShopName(body.shopId);
  } catch {
    return NextResponse.json(
      { error: "Invalid request", errorCode: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  const formData = new FormData();
  if (body.projectId) formData.set("projectId", body.projectId);
  if (body.dataset) formData.set("dataset", body.dataset);
  if (body.token) formData.set("token", body.token);
  if (body.aclMode) formData.set("aclMode", body.aclMode);
  if (body.createDataset) formData.set("createDataset", "true");
  if (body.enableEditorial) formData.set("enableEditorial", "on");
  if (body.promoteSchedule) formData.set("promoteSchedule", body.promoteSchedule);

  const result = await saveSanityConfig(shopId, formData);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
