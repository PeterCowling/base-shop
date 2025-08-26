// test/__mocks__/pluginSanityStub.ts
// Minimal stub for the Sanity plugin so tests can intercept network calls

export interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
}

export async function query<T>(config: SanityConfig, q: string): Promise<T> {
  const res = await fetch(
    `https://${config.projectId}.api.sanity.io/v2023-01-01/data/query/${config.dataset}?query=${encodeURIComponent(
      q,
    )}`,
  );
  const json = typeof res.json === "function" ? await res.json() : {};
  return (json.result ?? json.results) as T;
}

export async function mutate(
  config: SanityConfig,
  body: { mutations: any[]; returnIds?: boolean },
) {
  const res = await fetch(
    `https://${config.projectId}.api.sanity.io/v2023-01-01/data/mutate/${config.dataset}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(body),
    },
  );
  return res.json();
}

export async function slugExists(
  config: SanityConfig,
  slug: string,
  excludeId?: string,
) {
  const q = `*[_type=="post" && slug.current=="${slug}"${
    excludeId ? ` && _id!="${excludeId}"` : ""
  }][0]._id`;
  const res = await query<{ _id?: string } | null>(config, q);
  return Boolean(res?._id);
}

export default {};

