export type CloudflareWindow = {
  startIso: string;
  endIso: string;
};

export type TopMetricResult = {
  metric: string;
  value: number;
};

export type CloudflareProxySlice = {
  totalsValue: number | null;
  totalsNote: string;
  pages: TopMetricResult[];
  pagesNote: string;
  geos: TopMetricResult[];
  geosNote: string;
  devices: TopMetricResult[];
  devicesNote: string;
};

export type MonthlyRequestTotals = {
  requests: number | null;
  note: string;
};

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type TotalsQueryData = {
  viewer?: {
    zones?: Array<{
      series?: Array<{
        count?: number | null;
        sum?: {
          visits?: number | null;
          requests?: number | null;
        } | null;
      }>;
    }>;
  };
};

type TopQueryData = {
  viewer?: {
    zones?: Array<{
      series?: Array<{
        count?: number | null;
        dimensions?: {
          metric?: string | null;
        } | null;
      }>;
    }>;
  };
};

type ZonesApiResponse = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: Array<{
    id?: string;
  }>;
};

async function postGraphql<TData>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<GraphQlResponse<TData>> {
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare GraphQL request failed: HTTP ${response.status}`);
  }
  return (await response.json()) as GraphQlResponse<TData>;
}

export async function resolveZoneTag(
  token: string,
  zoneTag?: string,
  zoneName?: string,
): Promise<string> {
  if (zoneTag) return zoneTag;
  if (!zoneName) {
    throw new Error("No zone selector provided (zone tag or zone name).");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=${encodeURIComponent(zoneName)}&per_page=1`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Cloudflare zone lookup failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ZonesApiResponse;
  if (!payload.success) {
    const messages = (payload.errors ?? [])
      .map((error) => error.message ?? "unknown error")
      .join("; ");
    throw new Error(`Cloudflare zone lookup failed: ${messages}`);
  }

  const resolved = payload.result?.[0]?.id;
  if (!resolved) {
    throw new Error(`No zone found for "${zoneName}".`);
  }
  return resolved;
}

function seriesFrom<T>(data: { viewer?: { zones?: Array<{ series?: T[] }> } }): T[] {
  return data.viewer?.zones?.[0]?.series ?? [];
}

function buildFilter(window: CloudflareWindow, hostname?: string): Record<string, unknown> {
  const andFilter: Array<Record<string, unknown>> = [
    { datetime_geq: window.startIso, datetime_lt: window.endIso },
    { requestSource: "eyeball" },
  ];
  if (hostname) andFilter.push({ clientRequestHTTPHost: hostname });
  return { AND: andFilter };
}

async function queryTotals(
  token: string,
  zoneTag: string,
  filter: Record<string, unknown>,
): Promise<{ value: number | null; note: string }> {
  const query = `query Totals($zoneTag: string, $filter: filter) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        series: httpRequestsAdaptiveGroups(limit: 1, filter: $filter) {
          count
          sum { visits }
        }
      }
    }
  }`;

  const response = await postGraphql<TotalsQueryData>(token, query, {
    zoneTag,
    filter,
  });
  if (response.errors && response.errors.length > 0) {
    const messages = response.errors.map((error) => error.message).join("; ");
    throw new Error(`Totals query failed: ${messages}`);
  }

  const first = seriesFrom(response.data ?? {})[0];
  const visits = first?.sum?.visits;
  const count = first?.count;
  if (typeof visits === "number") return { value: visits, note: "source=visits" };
  if (typeof count === "number") return { value: count, note: "source=requests(count)" };
  return { value: null, note: "source=unavailable" };
}

function hasUnknownFieldError(
  errors: Array<{ message?: string }>,
  fieldName: string,
): boolean {
  const needle = `Cannot query field "${fieldName}"`;
  return errors.some((error) => (error.message ?? "").includes(needle));
}

async function queryTopByDimension(
  token: string,
  zoneTag: string,
  filter: Record<string, unknown>,
  dimensionField: string,
  limit: number,
): Promise<{ ok: true; items: TopMetricResult[] } | { ok: false; unsupported: boolean; note: string }> {
  const query = `query Top($zoneTag: string, $filter: filter) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        series: httpRequestsAdaptiveGroups(
          filter: $filter
          limit: ${limit}
          orderBy: [sum_edgeResponseBytes_DESC]
        ) {
          count
          dimensions { metric: ${dimensionField} }
        }
      }
    }
  }`;

  const response = await postGraphql<TopQueryData>(token, query, {
    zoneTag,
    filter,
  });
  if (response.errors && response.errors.length > 0) {
    const note = response.errors.map((error) => error.message).join("; ");
    return {
      ok: false,
      unsupported: hasUnknownFieldError(response.errors, dimensionField),
      note,
    };
  }

  const items = seriesFrom(response.data ?? {})
    .map((row) => ({
      metric: (row.dimensions?.metric ?? "").trim(),
      value: Number(row.count ?? 0),
    }))
    .filter((item) => item.metric.length > 0)
    .slice(0, limit);
  return { ok: true, items };
}

async function queryWithCandidates(
  token: string,
  zoneTag: string,
  filter: Record<string, unknown>,
  candidates: string[],
  limit: number,
): Promise<{ items: TopMetricResult[]; note: string }> {
  const notes: string[] = [];
  for (const candidate of candidates) {
    const response = await queryTopByDimension(token, zoneTag, filter, candidate, limit);
    if (response.ok) {
      return { items: response.items, note: `field=${candidate}` };
    }
    notes.push(
      response.unsupported ? `${candidate}:unsupported` : `${candidate}:${response.note}`,
    );
  }
  return { items: [], note: notes.join(" | ") || "no-candidate-succeeded" };
}

export async function fetchCloudflareProxySlice(params: {
  token: string;
  zoneTag: string;
  window: CloudflareWindow;
  hostname?: string;
}): Promise<CloudflareProxySlice> {
  const filter = buildFilter(params.window, params.hostname);
  const totals = await queryTotals(params.token, params.zoneTag, filter);
  const pages = await queryWithCandidates(
    params.token,
    params.zoneTag,
    filter,
    ["clientRequestPath"],
    5,
  );
  const geos = await queryWithCandidates(
    params.token,
    params.zoneTag,
    filter,
    ["clientCountryName", "clientCountryCode", "clientCountry"],
    5,
  );
  const devices = await queryWithCandidates(
    params.token,
    params.zoneTag,
    filter,
    ["deviceType", "clientDeviceType"],
    5,
  );

  return {
    totalsValue: totals.value,
    totalsNote: totals.note,
    pages: pages.items,
    pagesNote: pages.note,
    geos: geos.items,
    geosNote: geos.note,
    devices: devices.items,
    devicesNote: devices.note,
  };
}

export async function fetchMonthlyRequestTotals(params: {
  token: string;
  zoneTag: string;
  monthStart: string;
  monthEndInclusive: string;
}): Promise<MonthlyRequestTotals> {
  const query = `query Totals($zoneTag: string, $filter: filter) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        series: httpRequests1dGroups(limit: 62, filter: $filter) {
          sum { requests }
        }
      }
    }
  }`;

  const filter = {
    date_geq: params.monthStart,
    date_leq: params.monthEndInclusive,
  };
  const response = await postGraphql<TotalsQueryData>(params.token, query, {
    zoneTag: params.zoneTag,
    filter,
  });

  if (response.errors && response.errors.length > 0) {
    const note = response.errors.map((error) => error.message).join("; ");
    return { requests: null, note: `source=unavailable; ${note}` };
  }

  const rows = seriesFrom(response.data ?? {});
  const sum = rows.reduce(
    (acc, row) => acc + Number(row.sum?.requests ?? row.sum?.visits ?? row.count ?? 0),
    0,
  );
  return { requests: sum, note: "source=httpRequests1dGroups(sum.requests)" };
}
