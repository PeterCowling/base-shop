import { verifyCredentials } from "@acme/plugin-sanity";
import { createClient } from "@sanity/client";

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
    const client = createClient({
      projectId,
      dataset: dataset || "production",
      token,
      apiVersion: "2023-01-01",
      useCdn: false,
    });

    const list = await client.datasets.list();
    const datasets = list.map((d) => d.name);

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
    return Response.json(
      { ok: false, error: "Failed to list datasets", errorCode: "DATASET_LIST_ERROR" },
      { status: 500 },
    );
  }
}

