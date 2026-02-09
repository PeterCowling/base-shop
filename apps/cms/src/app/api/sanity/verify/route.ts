import { verifyCredentials } from "@acme/plugin-sanity";

export const runtime = "nodejs";

interface VerifyRequest {
  projectId: string;
  dataset?: string;
  token: string;
}

export async function POST(req: Request) {
  const { projectId, dataset, token } = (await req.json()) as VerifyRequest;

  if (!projectId || !token) {
    return Response.json(
      { ok: false, error: "Missing projectId or token", errorCode: "INVALID_CREDENTIALS" },
      { status: 400 },
    );
  }

  try {
    const resp = await fetch(
      `https://${projectId}.api.sanity.io/v2023-01-01/datasets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!resp.ok) throw new Error("Failed to list datasets");
    const list = (await resp.json()) as { datasets?: { name: string }[] };
    const datasets = list.datasets?.map((d) => d.name) ?? [];

    if (dataset) {
      const valid = await verifyCredentials({ projectId, dataset, token });
      if (!valid) {
        return Response.json(
          { ok: false, error: "Invalid Sanity credentials", errorCode: "INVALID_CREDENTIALS", datasets },
          { status: 401 },
        );
      }
    }

    return Response.json({ ok: true, datasets });
  } catch (err) {
    console.error(err);
    return Response.json(
      { ok: false, error: "Failed to list datasets", errorCode: "DATASET_LIST_ERROR" },
      { status: 500 },
    );
  }
}

